/**
 * BiometricSetupScreen
 *
 * Guides the user through enrolling device biometrics for CIVITAS.
 * Uses the real expo-local-authentication API:
 *  - hasHardwareAsync()                      â†’ check hardware availability
 *  - supportedAuthenticationTypesAsync()     â†’ fingerprint / face-ID / iris
 *  - isEnrolledAsync()                       â†’ OS-level enrollment check
 *  - authenticateAsync()                     â†’ live authentication prompt
 *
 * Enrollment status is persisted to AsyncStorage so other screens
 * (WalletScreen, GovernanceScreen, IdentityScreen) can gate sensitive
 * actions behind biometric re-authentication.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Switch,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';

// â”€â”€â”€ AsyncStorage keys â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BIOMETRIC_KEY        = 'civitas_biometric_enrolled';
const BIOMETRIC_USAGES_KEY = 'civitas_biometric_usages';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AUTH_TYPE_LABELS = {
  [LocalAuthentication.AuthenticationType.FINGERPRINT]:        { label: 'Fingerprint', icon: 'ðŸ‘†' },
  [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]: { label: 'Face ID',     icon: 'ðŸ˜Š' },
  [LocalAuthentication.AuthenticationType.IRIS]:               { label: 'Iris Scan',   icon: 'ðŸ‘ï¸' },
};

export default function BiometricSetupScreen({ navigation }) {
  const { wallet } = useApp();

  // â”€â”€ Hardware probe state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [probing, setProbing]               = useState(true);
  const [hasHardware, setHasHardware]       = useState(false);
  const [supportedTypes, setSupportedTypes] = useState([]);
  const [isEnrolled, setIsEnrolled]         = useState(false);

  // â”€â”€ Wizard state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [currentStep, setCurrentStep]           = useState(1);
  const [authenticating, setAuthenticating]     = useState(false);
  const [authResult, setAuthResult]             = useState(null); // null | 'success' | 'failed'

  // â”€â”€ Usage toggles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [usageScenarios, setUsageScenarios] = useState({
    appUnlock:    true,
    transactions: true,
    governance:   false,
    identity:     true,
  });

  // â”€â”€ Security level â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [securityLevel, setSecurityLevel] = useState('balanced');

  // â”€â”€â”€ Probe hardware on mount â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => { probeHardware(); }, []);

  const probeHardware = async () => {
    setProbing(true);
    try {
      const hw       = await LocalAuthentication.hasHardwareAsync();
      const types    = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasHardware(hw);
      setSupportedTypes(types);
      setIsEnrolled(enrolled);
      console.log('[Biometric] hw:', hw, 'types:', types, 'enrolled:', enrolled);
    } catch (err) {
      console.error('[Biometric] probe error:', err);
    } finally {
      setProbing(false);
    }
  };

  // â”€â”€â”€ Live authentication â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const runAuthentication = useCallback(async () => {
    if (!hasHardware) {
      Alert.alert('Not Supported', 'This device has no biometric hardware.');
      return false;
    }
    if (!isEnrolled) {
      Alert.alert(
        'No Biometrics Enrolled',
        'Please enrol a fingerprint or Face ID in your device Settings first.',
      );
      return false;
    }

    setAuthenticating(true);
    setAuthResult(null);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:         'Authenticate to enable CIVITAS biometric security',
        cancelLabel:           'Cancel',
        disableDeviceFallback: false,
        fallbackLabel:         'Use PIN',
      });
      console.log('[Biometric] result:', result);

      if (result.success) {
        setAuthResult('success');
        return true;
      } else {
        setAuthResult('failed');
        if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
          Alert.alert('Authentication Failed', result.error ?? 'Please try again.');
        }
        return false;
      }
    } catch (err) {
      setAuthResult('failed');
      Alert.alert('Error', err.message);
      return false;
    } finally {
      setAuthenticating(false);
    }
  }, [hasHardware, isEnrolled]);

  // â”€â”€â”€ Persist enrollment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const persistEnrollment = useCallback(async (enrolled) => {
    await AsyncStorage.setItem(BIOMETRIC_KEY, String(enrolled));
    await AsyncStorage.setItem(BIOMETRIC_USAGES_KEY, JSON.stringify(usageScenarios));
  }, [usageScenarios]);

  // â”€â”€â”€ Complete setup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleCompleteBiometricSetup = useCallback(async () => {
    if (!wallet?.address) {
      Alert.alert('Connect Wallet', 'Please connect your wallet before enabling biometrics.');
      return;
    }
    const passed = await runAuthentication();
    if (!passed) return;
    await persistEnrollment(true);
    Alert.alert(
      'âœ… Biometrics Enabled',
      `Now active for: ${Object.entries(usageScenarios).filter(([,v]) => v).map(([k]) => k).join(', ')}`,
      [{ text: 'Done', onPress: () => navigation.goBack() }]
    );
  }, [wallet, runAuthentication, persistEnrollment, usageScenarios, navigation]);

  // â”€â”€â”€ Wizard navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const totalSteps = 4;

  const nextStep = useCallback(async () => {
    if (currentStep === 2) {
      const ok = await runAuthentication();
      if (!ok) return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
    } else {
      await handleCompleteBiometricSetup();
    }
  }, [currentStep, runAuthentication, handleCompleteBiometricSetup]);

  const prevStep  = () => currentStep > 1 && setCurrentStep((s) => s - 1);
  const skipSetup = async () => { await persistEnrollment(false); navigation.goBack(); };

  // â”€â”€â”€ Step renderers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepIcon}>ðŸ”</Text>
      <Text style={styles.stepTitle}>Biometric Authentication</Text>
      <Text style={styles.stepDescription}>
        Secure your CIVITAS account with biometrics for fast and safe access to
        your wallet, governance votes and identity.
      </Text>
      <View style={styles.detectionCard}>
        <Text style={styles.detectionTitle}>Available on Your Device:</Text>
        {probing ? (
          <ActivityIndicator color="#6B21A8" style={{ marginVertical: 16 }} />
        ) : !hasHardware ? (
          <View style={styles.notSupportedBanner}>
            <Text style={styles.notSupportedText}>
              âš ï¸ No biometric hardware detected. PIN fallback is available.
            </Text>
          </View>
        ) : (
          supportedTypes.map((t) => {
            const meta = AUTH_TYPE_LABELS[t] ?? { label: `Type ${t}`, icon: 'ðŸ”’' };
            return (
              <View key={t} style={styles.biometricOption}>
                <View style={styles.optionLeft}>
                  <Text style={styles.optionIcon}>{meta.icon}</Text>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{meta.label}</Text>
                    <Text style={styles.optionDescription}>
                      {isEnrolled ? 'Enrolled in device settings' : 'Go to Settings to enrol'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.supportBadge, isEnrolled ? styles.badgeGreen : styles.badgeYellow]}>
                  <Text style={styles.supportBadgeText}>{isEnrolled ? 'âœ“ Ready' : 'âš  Not enrolled'}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepIcon}>ðŸŽ¯</Text>
      <Text style={styles.stepTitle}>Choose Security Level</Text>
      {['quick', 'balanced', 'high'].map((level) => (
        <TouchableOpacity
          key={level}
          style={[styles.securityOption, securityLevel === level && styles.securityOptionActive]}
          onPress={() => setSecurityLevel(level)}
        >
          <Text style={styles.securityOptionTitle}>
            {level === 'quick' ? 'âš¡ Quick Access' : level === 'balanced' ? 'âš–ï¸ Balanced (Recommended)' : 'ðŸ›¡ï¸ Maximum Security'}
          </Text>
          <Text style={styles.securityOptionDesc}>
            {level === 'quick'    ? 'Biometric for all actions â€” fastest experience'
              : level === 'balanced' ? 'Biometric for transactions & governance'
              : 'Biometric + PIN for high-value actions'}
          </Text>
          {securityLevel === level && <Text style={styles.checkmark}>âœ“</Text>}
        </TouchableOpacity>
      ))}
      <Text style={styles.sectionLabel}>Protect these actions:</Text>
      {Object.entries(usageScenarios).map(([key, val]) => (
        <View key={key} style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>
            {key === 'appUnlock' ? 'ðŸ“± App Unlock' : key === 'transactions' ? 'ðŸ’¸ Transactions' : key === 'governance' ? 'ðŸ—³ï¸ Governance Votes' : 'ðŸªª Identity Actions'}
          </Text>
          <Switch
            value={val}
            onValueChange={(v) => setUsageScenarios((prev) => ({ ...prev, [key]: v }))}
            trackColor={{ true: '#6B21A8', false: '#ccc' }}
            thumbColor={val ? '#fff' : '#f4f3f4'}
          />
        </View>
      ))}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepIcon}>{authResult === 'success' ? 'âœ…' : 'ðŸ‘†'}</Text>
      <Text style={styles.stepTitle}>Verify Your Identity</Text>
      <Text style={styles.stepDescription}>
        Touch the scanner or look at the camera to confirm enrollment in CIVITAS.
      </Text>
      {authResult === 'success' ? (
        <View style={styles.successBanner}><Text style={styles.successText}>âœ… Biometric verified!</Text></View>
      ) : authResult === 'failed' ? (
        <View style={styles.errorBanner}><Text style={styles.errorText}>âŒ Verification failed â€” tap Next to retry.</Text></View>
      ) : (
        <View style={styles.pendingBanner}><Text style={styles.pendingText}>Tap <Text style={{ fontWeight: 'bold' }}>Next</Text> to launch the biometric prompt.</Text></View>
      )}
      {authenticating && <ActivityIndicator color="#6B21A8" size="large" style={{ marginTop: 24 }} />}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepIcon}>ðŸŽ‰</Text>
      <Text style={styles.stepTitle}>All Set!</Text>
      <Text style={styles.stepDescription}>Biometric authentication is configured for your CIVITAS account.</Text>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Security Summary</Text>
        <Text style={styles.summaryRow}>Level:   <Text style={styles.summaryValue}>{securityLevel}</Text></Text>
        <Text style={styles.summaryRow}>Types:   <Text style={styles.summaryValue}>{supportedTypes.map((t) => AUTH_TYPE_LABELS[t]?.label ?? `Type ${t}`).join(', ') || 'None'}</Text></Text>
        <Text style={styles.summaryRow}>Actions: <Text style={styles.summaryValue}>{Object.entries(usageScenarios).filter(([,v]) => v).map(([k]) => k).join(', ')}</Text></Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>â†</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Biometric Setup</Text>
        <TouchableOpacity onPress={skipSetup}>
          <Text style={styles.skipBtn}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressBar}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={i}
            style={[styles.progressSegment, i < currentStep ? styles.progressSegmentActive : styles.progressSegmentInactive]}
          />
        ))}
      </View>
      <Text style={styles.stepIndicator}>Step {currentStep} of {totalSteps}</Text>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.navButtons}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.prevBtn} onPress={prevStep}>
            <Text style={styles.prevBtnText}>â† Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, authenticating && styles.nextBtnDisabled]}
          onPress={nextStep}
          disabled={authenticating}
        >
          {authenticating
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.nextBtnText}>{currentStep === totalSteps ? 'âœ“ Enable Biometrics' : 'Next â†’'}</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: '#0F0F0F' },
  header:                 { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  backBtn:                { color: '#fff', fontSize: 24 },
  headerTitle:            { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  skipBtn:                { color: '#9CA3AF', fontSize: 14 },
  progressBar:            { flexDirection: 'row', paddingHorizontal: 20, gap: 6, marginBottom: 4 },
  progressSegment:        { flex: 1, height: 4, borderRadius: 2 },
  progressSegmentActive:  { backgroundColor: '#7C3AED' },
  progressSegmentInactive:{ backgroundColor: '#374151' },
  stepIndicator:          { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginBottom: 12 },
  scrollView:             { flex: 1 },
  scrollContent:          { paddingHorizontal: 20, paddingBottom: 24 },
  stepContent:            { gap: 16 },
  stepIcon:               { fontSize: 48, textAlign: 'center', marginVertical: 8 },
  stepTitle:              { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  stepDescription:        { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  detectionCard:          { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, gap: 12 },
  detectionTitle:         { color: '#E5E7EB', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  biometricOption:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  optionLeft:             { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionIcon:             { fontSize: 24 },
  optionInfo:             { gap: 2 },
  optionTitle:            { color: '#fff', fontSize: 14, fontWeight: '600' },
  optionDescription:      { color: '#6B7280', fontSize: 12 },
  supportBadge:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeGreen:             { backgroundColor: '#064E3B' },
  badgeYellow:            { backgroundColor: '#78350F' },
  supportBadgeText:       { color: '#fff', fontSize: 11 },
  notSupportedBanner:     { backgroundColor: '#1F1010', borderRadius: 8, padding: 12 },
  notSupportedText:       { color: '#FCA5A5', fontSize: 13 },
  securityOption:         { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: 'transparent' },
  securityOptionActive:   { borderColor: '#7C3AED' },
  securityOptionTitle:    { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 6 },
  securityOptionDesc:     { color: '#9CA3AF', fontSize: 13 },
  checkmark:              { color: '#7C3AED', fontSize: 18, position: 'absolute', right: 16, top: 16 },
  sectionLabel:           { color: '#E5E7EB', fontSize: 14, fontWeight: '600', marginTop: 8 },
  toggleRow:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  toggleLabel:            { color: '#D1D5DB', fontSize: 14 },
  successBanner:          { backgroundColor: '#064E3B', borderRadius: 12, padding: 16 },
  successText:            { color: '#6EE7B7', fontSize: 15, textAlign: 'center' },
  errorBanner:            { backgroundColor: '#7F1D1D', borderRadius: 12, padding: 16 },
  errorText:              { color: '#FCA5A5', fontSize: 15, textAlign: 'center' },
  pendingBanner:          { backgroundColor: '#1F2937', borderRadius: 12, padding: 16 },
  pendingText:            { color: '#D1D5DB', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  summaryCard:            { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, gap: 10 },
  summaryTitle:           { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  summaryRow:             { color: '#9CA3AF', fontSize: 13, lineHeight: 20 },
  summaryValue:           { color: '#A78BFA', fontWeight: '600' },
  navButtons:             { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  prevBtn:                { flex: 1, borderWidth: 1, borderColor: '#374151', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  prevBtnText:            { color: '#9CA3AF', fontSize: 15 },
  nextBtn:                { flex: 2, backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  nextBtnDisabled:        { backgroundColor: '#4B2E83', opacity: 0.6 },
  nextBtnText:            { color: '#fff', fontSize: 15, fontWeight: '700' },
});
