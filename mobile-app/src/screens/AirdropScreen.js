import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export default function AirdropScreen({ navigation }) {
  const [tab, setTab]             = useState('claim');
  const [proofJson, setProofJson] = useState('');
  const [parsedProof, setParsed]  = useState(null);
  const [vestable, setVestable]   = useState('0');
  const [roundCount, setRounds]   = useState(0);
  const [loading, setLoading]     = useState(false);
  const [walletAddr, setWallet]   = useState('');

  // Fetch airdrop info from backend (round count, vested)
  useEffect(() => {
    if (walletAddr.length === 42) loadInfo();
  }, [walletAddr]);

  const loadInfo = async () => {
    try {
      // These call the read-only contract via a backend relayer endpoint
      // If not available, show placeholder values
      const r = await fetch(`${API}/api/airdrop/info?address=${walletAddr}`).catch(() => null);
      if (r && r.ok) {
        const d = await r.json();
        setVestable(d.vestable || '0');
        setRounds(d.roundCount || 0);
      }
    } catch {}
  };

  const parseProof = () => {
    try {
      const p = JSON.parse(proofJson);
      if (!p.roundId && p.roundId !== 0) throw new Error('Missing roundId');
      if (!p.amount) throw new Error('Missing amount');
      if (!Array.isArray(p.proof)) throw new Error('proof must be an array');
      setParsed(p);
      Alert.alert('✓ Proof Valid', `Round ${p.roundId} · ${p.amount} CIV`);
    } catch (e) {
      Alert.alert('Invalid Proof', e.message);
    }
  };

  const submitClaim = async (regional = false) => {
    if (!parsedProof) { Alert.alert('Error', 'Parse a proof first'); return; }
    if (!walletAddr)  { Alert.alert('Error', 'Enter your wallet address'); return; }
    setLoading(true);
    try {
      // In a production app this would call the contract via a signing session
      // Here we call a backend relay that prepares the unsigned tx
      const res = await fetch(`${API}/api/airdrop/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddr, ...parsedProof, regional }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Claim failed');
      Alert.alert('✅ Claimed', `Tx: ${data.txHash || 'pending'}`);
      setParsed(null); setProofJson('');
    } catch (e) {
      Alert.alert('Claim Failed', e.message);
    } finally { setLoading(false); }
  };

  const claimVested = async () => {
    if (!walletAddr) { Alert.alert('Error', 'Enter your wallet address'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/airdrop/claim-vested`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Claim failed');
      Alert.alert('✅ Vested Claimed', `You received ${data.amount || vestable} CIV`);
      setVestable('0');
    } catch (e) {
      Alert.alert('Claim Failed', e.message);
    } finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>🪂 CIVITAS Airdrop</Text>
      <Text style={s.subtitle}>Regional bonus: +5% · 180-day claim window</Text>

      {/* Tabs */}
      <View style={s.tabs}>
        {['claim', 'info'].map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t === 'claim' ? '⬇️ Claim' : 'ℹ️ Info'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'claim' && (
          <>
            <Text style={s.label}>Your Wallet Address</Text>
            <TextInput
              style={s.input}
              value={walletAddr}
              onChangeText={setWallet}
              placeholder="0x..."
              placeholderTextColor="#555"
            />

            {/* Stats */}
            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Text style={s.statLabel}>Active Rounds</Text>
                <Text style={s.statVal}>{roundCount}</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statLabel}>Claimable Vested</Text>
                <Text style={s.statVal}>{parseFloat(vestable).toFixed(2)} CIV</Text>
              </View>
            </View>

            {/* Vested claim */}
            {parseFloat(vestable) > 0 && (
              <View style={s.vestedCard}>
                <Text style={s.vestedTitle}>📅 Vested Available</Text>
                <Text style={s.vestedAmt}>{parseFloat(vestable).toFixed(4)} CIV</Text>
                <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={claimVested} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnPrimText}>✅ Claim Vested</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* Proof entry */}
            <Text style={s.label}>Merkle Proof JSON</Text>
            <Text style={s.hint}>Get your proof from the CIVITAS web portal or IPFS.</Text>
            <TextInput
              style={s.textarea}
              value={proofJson}
              onChangeText={setProofJson}
              multiline
              numberOfLines={6}
              placeholder={'{\n  "roundId": 1,\n  "amount": "100",\n  "proof": ["0x..."]\n}'}
              placeholderTextColor="#555"
            />

            {parsedProof && (
              <View style={s.proofPreview}>
                <Text style={s.proofText}>Round: {parsedProof.roundId}</Text>
                <Text style={s.proofText}>Amount: {parsedProof.amount} CIV</Text>
                <Text style={s.proofText}>Proof entries: {parsedProof.proof?.length}</Text>
              </View>
            )}

            <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={parseProof}>
              <Text style={s.btnSecText}>🔍 Parse Proof</Text>
            </TouchableOpacity>

            <View style={s.claimRow}>
              <TouchableOpacity style={[s.btn, s.btnPrimary, s.half, (!parsedProof || loading) && s.btnDisabled]} onPress={() => submitClaim(false)} disabled={!parsedProof || loading}>
                <Text style={s.btnPrimText}>⬇️ Claim</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnRegional, s.half, (!parsedProof || loading) && s.btnDisabled]} onPress={() => submitClaim(true)} disabled={!parsedProof || loading}>
                <Text style={s.btnPrimText}>🌍 Regional (+5%)</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {tab === 'info' && (
          <View style={s.infoCard}>
            {[
              ['Total Allocation', '20% of CIV supply'],
              ['Regional Bonus', '+5% for developing-region addresses'],
              ['Instant Mode', '100% claimable immediately'],
              ['Vested Mode', 'Linear unlock over 12 months'],
              ['Claim Window', '180 days per round'],
              ['DID Gate', 'Optional per round'],
            ].map(([k, v]) => (
              <View key={k} style={s.infoRow}>
                <Text style={s.infoKey}>{k}</Text>
                <Text style={s.infoVal}>{v}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  title:    { fontSize: 22, fontWeight: 'bold', color: '#e6edf3', paddingHorizontal: 20, paddingTop: 20 },
  subtitle: { fontSize: 13, color: '#8b949e', paddingHorizontal: 20, marginBottom: 12 },
  tabs:     { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 8 },
  tab:        { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: '#30363d' },
  tabActive:  { backgroundColor: '#1f6feb', borderColor: '#1f6feb' },
  tabText:    { color: '#8b949e', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  scroll:   { padding: 20 },
  label:    { fontSize: 13, color: '#8b949e', marginBottom: 6, marginTop: 14 },
  hint:     { fontSize: 12, color: '#555', marginBottom: 8 },
  input:    { backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 8, padding: 12, color: '#e6edf3', fontSize: 14 },
  textarea: { backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 8, padding: 12, color: '#e6edf3', fontFamily: 'monospace', fontSize: 12, minHeight: 120, textAlignVertical: 'top' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statBox:  { flex: 1, backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 10, padding: 14, alignItems: 'center' },
  statLabel:{ color: '#8b949e', fontSize: 11, marginBottom: 4 },
  statVal:  { color: '#58a6ff', fontSize: 18, fontWeight: 'bold' },
  vestedCard: { backgroundColor: '#1a2e1a', borderWidth: 1, borderColor: '#2ea043', borderRadius: 10, padding: 16, marginTop: 16, alignItems: 'center' },
  vestedTitle:{ color: '#3fb950', fontWeight: 'bold', marginBottom: 4 },
  vestedAmt:  { color: '#e6edf3', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  proofPreview: { backgroundColor: '#161b22', borderRadius: 8, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#30363d' },
  proofText:    { color: '#e6edf3', fontSize: 13, marginBottom: 2 },
  claimRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  half:     { flex: 1 },
  btn:      { padding: 13, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnPrimary:   { backgroundColor: '#1f6feb' },
  btnSecondary: { backgroundColor: '#21262d', borderWidth: 1, borderColor: '#30363d' },
  btnRegional:  { backgroundColor: '#2ea043' },
  btnDisabled:  { opacity: 0.5 },
  btnPrimText:  { color: '#fff', fontWeight: 'bold' },
  btnSecText:   { color: '#e6edf3' },
  infoCard: { backgroundColor: '#161b22', borderRadius: 10, borderWidth: 1, borderColor: '#30363d', padding: 16 },
  infoRow:  { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  infoKey:  { color: '#8b949e', fontSize: 13, flex: 1 },
  infoVal:  { color: '#e6edf3', fontSize: 13, flex: 1.2 },
});
