import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

const STATUSES = {
  PENDING:    '#f39c12',
  PROCESSING: '#3498db',
  COMPLETED:  '#27ae60',
  FAILED:     '#e74c3c',
  CANCELLED:  '#7f8c8d',
};

export default function MobileMoneyScreen({ navigation }) {
  const [tab, setTab]                   = useState('send');
  const [providers, setProviders]       = useState([]);
  const [selectedProvider, setProvider] = useState('');
  const [currencies, setCurrencies]     = useState([]);
  const [currency, setCurrency]         = useState('');
  const [direction, setDirection]       = useState('FIAT_TO_CIV');
  const [amount, setAmount]             = useState('');
  const [phone, setPhone]               = useState('');
  const [wallet, setWallet]             = useState('');
  const [quote, setQuote]               = useState(null);
  const [history, setHistory]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/mobile-money/providers`)
      .then(r => r.json())
      .then(({ providers: p }) => setProviders(p))
      .catch(() => Alert.alert('Error', 'Unable to load providers'));
  }, []);

  useEffect(() => {
    const p = providers.find(x => x.id === selectedProvider);
    if (p) { setCurrencies(p.currencies); setCurrency(p.currencies[0] || ''); }
    else { setCurrencies([]); setCurrency(''); }
    setQuote(null);
  }, [selectedProvider, providers]);

  const loadHistory = useCallback(async () => {
    if (wallet.length !== 42) return;
    setRefreshing(true);
    try {
      const r = await fetch(`${API_URL}/api/mobile-money/history/${wallet}`);
      const { transactions } = await r.json();
      setHistory(transactions || []);
    } catch {}
    finally { setRefreshing(false); }
  }, [wallet]);

  const fetchQuote = async () => {
    if (!selectedProvider || !currency || !amount) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mobile-money/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider, currency, amount: Number(amount), direction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuote(data.quote);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); }
  };

  const initiate = async () => {
    if (!wallet || !phone || !quote) {
      Alert.alert('Missing fields', 'Please enter wallet address, phone, and get a quote first.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mobile-money/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet, provider: selectedProvider, currency, amount: Number(amount), direction, phoneNumber: phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Alert.alert('✅ Submitted', `Transaction ID: ${data.transaction.id}`);
      setQuote(null); setAmount('');
      setHistory(prev => [data.transaction, ...prev]);
      setTab('history');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); }
  };

  const pollStatus = async (txId) => {
    try {
      const r = await fetch(`${API_URL}/api/mobile-money/status/${txId}`);
      const { transaction } = await r.json();
      setHistory(prev => prev.map(t => t.id === txId ? transaction : t));
    } catch {}
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>📱 Mobile Money Bridge</Text>
      <Text style={s.subtitle}>Exchange local currencies ↔ CIV tokens</Text>

      {/* Tabs */}
      <View style={s.tabs}>
        {['send', 'history'].map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => { setTab(t); if (t === 'history') loadHistory(); }}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t === 'send' ? '💱 Exchange' : '📜 History'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadHistory} tintColor="#58a6ff" />}>
        {tab === 'send' && (
          <>
            <Text style={s.label}>Wallet Address</Text>
            <TextInput style={s.input} value={wallet} onChangeText={setWallet} placeholder="0x..." placeholderTextColor="#555" />

            {/* Direction */}
            <Text style={s.label}>Direction</Text>
            <View style={s.row}>
              {[{ v:'FIAT_TO_CIV', l:'Fiat → CIV'}, {v:'CIV_TO_FIAT', l:'CIV → Fiat'}].map(d => (
                <TouchableOpacity key={d.v} style={[s.dirBtn, direction === d.v && s.dirBtnActive]} onPress={() => { setDirection(d.v); setQuote(null); }}>
                  <Text style={[s.dirText, direction === d.v && s.dirTextActive]}>{d.l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Provider picker */}
            <Text style={s.label}>Provider</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hScroll}>
              {providers.map(p => (
                <TouchableOpacity key={p.id} style={[s.provBtn, selectedProvider === p.id && s.provBtnActive]} onPress={() => setProvider(p.id)}>
                  <Text style={[s.provText, selectedProvider === p.id && s.provTextActive]}>{p.name}</Text>
                  <Text style={s.provCountry}>{p.countries.join(', ')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Currency picker */}
            {currencies.length > 0 && (
              <>
                <Text style={s.label}>Currency</Text>
                <View style={s.row}>
                  {currencies.map(c => (
                    <TouchableOpacity key={c} style={[s.curBtn, currency === c && s.curBtnActive]} onPress={() => { setCurrency(c); setQuote(null); }}>
                      <Text style={[s.curText, currency === c && s.curTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={s.label}>{direction === 'FIAT_TO_CIV' ? `Amount (${currency || 'local'})` : 'Amount (CIV)'}</Text>
            <TextInput style={s.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" placeholderTextColor="#555" />

            <Text style={s.label}>Mobile Number</Text>
            <TextInput style={s.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+256700000000" placeholderTextColor="#555" />

            {/* Quote box */}
            {quote && (
              <View style={s.quoteBox}>
                <Text style={s.quoteTitle}>Quote (valid 60s)</Text>
                {direction === 'FIAT_TO_CIV' ? (
                  <>
                    <Text style={s.quoteText}>Send: {quote.fiatAmount} {quote.currency}</Text>
                    <Text style={s.quoteText}>Receive: {quote.civAmount} CIV</Text>
                    <Text style={s.quoteFee}>Fee: {quote.feeFiat} {quote.currency}</Text>
                  </>
                ) : (
                  <>
                    <Text style={s.quoteText}>Send: {quote.civAmount} CIV</Text>
                    <Text style={s.quoteText}>Receive: {quote.fiatAmount} {quote.currency}</Text>
                    <Text style={s.quoteFee}>Fee: {quote.feeCIV} CIV</Text>
                  </>
                )}
              </View>
            )}

            <View style={s.row}>
              <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={fetchQuote} disabled={!selectedProvider || !currency || !amount || loading}>
                <Text style={s.btnSecText}>{loading ? '...' : '🔍 Quote'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnPrimary, (!quote || loading) && s.btnDisabled]} onPress={initiate} disabled={!quote || loading}>
                <Text style={s.btnPrimText}>{loading ? <ActivityIndicator color="#fff" size="small" /> : '✅ Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {tab === 'history' && (
          <>
            <Text style={s.label}>Wallet Address</Text>
            <TextInput style={s.input} value={wallet} onChangeText={setWallet} placeholder="0x..." placeholderTextColor="#555" onSubmitEditing={loadHistory} returnKeyType="search" />
            {history.length === 0
              ? <Text style={s.empty}>No transactions found. Pull to refresh.</Text>
              : history.map(tx => (
                <View key={tx.id} style={s.txCard}>
                  <View style={s.txHeader}>
                    <Text style={s.txId} numberOfLines={1}>{tx.id}</Text>
                    <View style={[s.badge, { backgroundColor: STATUSES[tx.status] || '#555' }]}>
                      <Text style={s.badgeText}>{tx.status}</Text>
                    </View>
                  </View>
                  <Text style={s.txAmount}>
                    {tx.direction === 'FIAT_TO_CIV'
                      ? `${tx.quote?.fiatAmount} ${tx.currency} → ${tx.quote?.civAmount} CIV`
                      : `${tx.quote?.civAmount} CIV → ${tx.quote?.fiatAmount} ${tx.currency}`}
                  </Text>
                  <View style={s.txFooter}>
                    <Text style={s.txDate}>{new Date(tx.createdAt).toLocaleString()}</Text>
                    {(tx.status === 'PENDING' || tx.status === 'PROCESSING') && (
                      <TouchableOpacity onPress={() => pollStatus(tx.id)}>
                        <Text style={s.refreshLink}>🔄 Refresh</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            }
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#e6edf3', padding: 20, paddingBottom: 4 },
  subtitle: { fontSize: 13, color: '#8b949e', paddingHorizontal: 20, marginBottom: 12 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#30363d' },
  tabActive: { backgroundColor: '#1f6feb', borderColor: '#1f6feb' },
  tabText: { color: '#8b949e', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  scroll: { padding: 20 },
  label: { fontSize: 13, color: '#8b949e', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 8, padding: 12, color: '#e6edf3', fontSize: 15 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  dirBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#30363d', alignItems: 'center' },
  dirBtnActive: { borderColor: '#1f6feb', backgroundColor: '#1f2d3d' },
  dirText: { color: '#8b949e', fontSize: 13 },
  dirTextActive: { color: '#58a6ff' },
  hScroll: { marginVertical: 8 },
  provBtn: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#30363d', marginRight: 10, minWidth: 130 },
  provBtnActive: { borderColor: '#1f6feb', backgroundColor: '#1f2d3d' },
  provText: { color: '#e6edf3', fontSize: 13, fontWeight: '600' },
  provTextActive: { color: '#58a6ff' },
  provCountry: { color: '#8b949e', fontSize: 11, marginTop: 2 },
  curBtn: { padding: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#30363d' },
  curBtnActive: { borderColor: '#1f6feb', backgroundColor: '#1f2d3d' },
  curText: { color: '#8b949e', fontSize: 13 },
  curTextActive: { color: '#58a6ff' },
  quoteBox: { backgroundColor: '#1c2b1c', borderWidth: 1, borderColor: '#2ea043', borderRadius: 8, padding: 16, marginTop: 16 },
  quoteTitle: { color: '#3fb950', fontWeight: 'bold', marginBottom: 8 },
  quoteText: { color: '#e6edf3', fontSize: 14, marginBottom: 2 },
  quoteFee: { color: '#8b949e', fontSize: 13, marginTop: 4 },
  btn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  btnPrimary: { backgroundColor: '#1f6feb' },
  btnSecondary: { backgroundColor: '#21262d', borderWidth: 1, borderColor: '#30363d' },
  btnDisabled: { backgroundColor: '#1a3a5e', opacity: 0.6 },
  btnPrimText: { color: '#fff', fontWeight: 'bold' },
  btnSecText: { color: '#e6edf3' },
  empty: { color: '#8b949e', textAlign: 'center', marginTop: 40, fontSize: 14 },
  txCard: { backgroundColor: '#161b22', borderRadius: 8, borderWidth: 1, borderColor: '#30363d', padding: 14, marginBottom: 12 },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  txId: { color: '#8b949e', fontSize: 11, fontFamily: 'monospace', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  txAmount: { color: '#e6edf3', fontSize: 14, marginBottom: 6 },
  txFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txDate: { color: '#8b949e', fontSize: 11 },
  refreshLink: { color: '#58a6ff', fontSize: 12 },
});
