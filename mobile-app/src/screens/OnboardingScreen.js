import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to CIVITAS',
      emoji: '🌍',
      description: 'Your personal decentralized ecosystem. Own your data, control your identity, and connect directly with the world.',
      highlight: 'No middlemen. No surveillance. Just you.',
    },
    {
      title: 'Self-Sovereign Identity',
      emoji: '🔐',
      description: 'Create your digital identity that you control. No corporation owns your data.',
      highlight: 'One identity for everything - secure and private.',
    },
    {
      title: 'Non-Custodial Wallet',
      emoji: '💰',
      description: 'Your money, your control. We can\'t access your funds - only you hold the keys.',
      highlight: 'Store, send, and earn CIV tokens directly.',
    },
    {
      title: 'Decentralized Storage',
      emoji: '📦',
      description: 'Store files on IPFS. Encrypted, distributed, and always accessible.',
      highlight: 'Your documents belong to you, not a cloud provider.',
    },
    {
      title: 'Make Your Voice Heard',
      emoji: '🗳️',
      description: 'Participate in governance through quadratic voting. Every voice matters.',
      highlight: 'Shape the future of CIVITAS together.',
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Navigate to main app
      navigation?.navigate('Home');
    }
  };

  const handleSkip = () => {
    navigation?.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.progressDotActive,
                index < currentStep && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Main Content */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{currentStepData.emoji}</Text>
          </View>

          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          <Text style={styles.stepDescription}>{currentStepData.description}</Text>

          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>{currentStepData.highlight}</Text>
          </View>

          {/* Feature List */}
          {currentStep === 0 && (
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Built for developing nations</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Works offline when needed</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>100% open source</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Community-governed</Text>
              </View>
            </View>
          )}

          {currentStep === 2 && (
            <View style={styles.securityNote}>
              <Text style={styles.securityTitle}>🛡️ Security First</Text>
              <Text style={styles.securityText}>
                You'll receive a recovery phrase. Write it down and keep it safe. It's the ONLY way to recover your account.
              </Text>
            </View>
          )}

          {currentStep === 4 && (
            <View style={styles.finalNote}>
              <Text style={styles.finalTitle}>🎉 You're Ready!</Text>
              <Text style={styles.finalText}>
                Join 2.5 million people building a fairer, more accessible financial future.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep < steps.length - 1 ? (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipButton} />
          )}

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a1a2e',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#0f3460',
  },
  progressDotCompleted: {
    backgroundColor: '#4caf50',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emojiContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  emoji: {
    fontSize: 80,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: '#c4c4c4',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  highlightBox: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0f3460',
    marginBottom: 30,
  },
  highlightText: {
    fontSize: 14,
    color: '#0f3460',
    fontWeight: '600',
    textAlign: 'center',
  },
  featureList: {
    marginTop: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureIcon: {
    fontSize: 20,
    color: '#4caf50',
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: '#c4c4c4',
    flex: 1,
  },
  securityNote: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9800',
    marginBottom: 10,
  },
  securityText: {
    fontSize: 13,
    color: '#c4c4c4',
    lineHeight: 20,
  },
  finalNote: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  finalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  finalText: {
    fontSize: 14,
    color: '#c4c4c4',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#8b8b8b',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#0f3460',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});
