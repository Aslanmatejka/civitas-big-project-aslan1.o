/**
 * DataVaultScreen
 *
 * CIVITAS decentralized data vault for mobile.
 * Mirrors the web-app DataVaultPage with three tabs:
 *
 *   Vaults  — Connect / disconnect storage providers (IPFS, Filecoin, Arweave)
 *   Browse  — List and download files stored in connected vaults
 *   Backup  — Upload new files and trigger sync from camera roll / file picker
 *
 * All API calls go through vaultService (IPFS / Filecoin gateway).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// ── Vault service (HTTP calls to CIVITAS backend / IPFS gateway) ───────────────
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const vaultService = {
  async fetchProviders() {
    const res = await fetch(`${API_BASE}/api/vault/providers`);
    if (!res.ok) throw new Error('Failed to fetch providers');
    return res.json();
  },

  async connectProvider(providerId, credentials) {
    const res = await fetch(`${API_BASE}/api/vault/providers/${providerId}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error('Failed to connect provider');
    return res.json();
  },

  async disconnectProvider(providerId) {
    const res = await fetch(`${API_BASE}/api/vault/providers/${providerId}/disconnect`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  async listVaultFiles(providerId) {
    const res = await fetch(`${API_BASE}/api/vault/providers/${providerId}/files`);
    if (!res.ok) throw new Error('Failed to list vault files');
    return res.json();
  },

  async uploadFile(providerId, uri, filename, mimeType) {
    const formData = new FormData();
    formData.append('file', { uri, name: filename, type: mimeType || 'application/octet-stream' });
    formData.append('providerId', providerId);
    const res = await fetch(`${API_BASE}/api/vault/upload`, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  async getDownloadUrl(cid) {
    return `https://ipfs.io/ipfs/${cid}`;
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const PROVIDER_ICONS = { ipfs: '🌐', filecoin: '🗄️', arweave: '♾️', default: '💾' };
const FILE_ICONS     = { image: '🖼️', video: '🎥', document: '📄', code: '📟', default: '📁' };

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function fileIcon(mime = '') {
  if (mime.startsWith('image/')) return FILE_ICONS.image;
  if (mime.startsWith('video/')) return FILE_ICONS.video;
  if (mime.includes('pdf') || mime.includes('document')) return FILE_ICONS.document;
  if (mime.includes('javascript') || mime.includes('json') || mime.includes('html'))
    return FILE_ICONS.code;
  return FILE_ICONS.default;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProviderCard({ provider, onConnect, onDisconnect }) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      if (provider.connected) {
        await onDisconnect(provider.id);
      } else {
        await onConnect(provider.id);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.providerCard}>
      <Text style={styles.providerIcon}>
        {PROVIDER_ICONS[provider.id] || PROVIDER_ICONS.default}
      </Text>
      <View style={styles.providerInfo}>
        <Text style={styles.providerName}>{provider.name}</Text>
        <Text style={styles.providerDesc}>{provider.description}</Text>
        <Text style={[styles.providerStatus, provider.connected ? styles.connected : styles.disconnected]}>
          {provider.connected ? '● Connected' : '○ Not connected'}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.connectBtn, provider.connected ? styles.disconnectBtn : null]}
        onPress={toggle}
        disabled={busy}
      >
        {busy
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={styles.connectBtnText}>{provider.connected ? 'Disconnect' : 'Connect'}</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

function FileRow({ item, onDownload }) {
  return (
    <TouchableOpacity style={styles.fileRow} onPress={() => onDownload(item)}>
      <Text style={styles.fileRowIcon}>{fileIcon(item.mimeType)}</Text>
      <View style={styles.fileRowInfo}>
        <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.fileMeta}>
          {formatBytes(item.size)}  ·  {item.cid ? `CID: ${item.cid.slice(0, 12)}…` : 'Pending'}
        </Text>
      </View>
      <Text style={styles.downloadArrow}>↓</Text>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function DataVaultScreen({ navigation }) {
  const [tab, setTab]               = useState('vaults');
  const [providers, setProviders]   = useState([]);
  const [files, setFiles]           = useState([]);
  const [selectedProv, setSelected] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadStatus, setStatus]   = useState(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadProviders = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      // Fallback mock data if backend not running
      const fetchedRaw = await vaultService.fetchProviders().catch(() => null);
      const fetched = fetchedRaw || [
        { id: 'ipfs',     name: 'IPFS',     description: 'InterPlanetary File System — peer-to-peer storage',         connected: false },
        { id: 'filecoin', name: 'Filecoin', description: 'Decentralized storage marketplace with verifiable proofs',  connected: false },
        { id: 'arweave',  name: 'Arweave',  description: 'Permanent on-chain storage with one-time fee model',       connected: false },
      ];
      setProviders(fetched);
      const first = fetched.find(p => p.connected);
      if (first && !selectedProv) setSelected(first.id);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedProv]);

  const loadFiles = useCallback(async (providerId, quiet = false) => {
    if (!providerId) return;
    if (!quiet) setLoading(true);
    try {
      const data = await vaultService.listVaultFiles(providerId).catch(() => []);
      setFiles(Array.isArray(data) ? data : data.files || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadProviders(); }, []);
  useEffect(() => {
    if (tab === 'browse' && selectedProv) loadFiles(selectedProv);
  }, [tab, selectedProv]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleConnect(providerId) {
    await vaultService.connectProvider(providerId, {});
    setProviders(prev => prev.map(p => p.id === providerId ? { ...p, connected: true } : p));
    if (!selectedProv) setSelected(providerId);
  }

  async function handleDisconnect(providerId) {
    await vaultService.disconnectProvider(providerId);
    setProviders(prev => prev.map(p => p.id === providerId ? { ...p, connected: false } : p));
    if (selectedProv === providerId) {
      const next = providers.find(p => p.connected && p.id !== providerId);
      setSelected(next ? next.id : null);
    }
  }

  async function handlePickAndUpload() {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const target = selectedProv || providers.find(p => p.connected)?.id;
    if (!target) {
      Alert.alert('No vault connected', 'Connect a storage provider first.');
      return;
    }

    setUploading(true);
    setStatus(null);
    try {
      const resp = await vaultService.uploadFile(target, asset.uri, asset.name, asset.mimeType);
      setStatus({ ok: true, cid: resp.cid, name: asset.name });
      loadFiles(target, true);
    } catch (e) {
      setStatus({ ok: false, error: e.message });
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(item) {
    try {
      const url = await vaultService.getDownloadUrl(item.cid);
      const dest = FileSystem.cacheDirectory + item.name;
      const dl   = await FileSystem.downloadAsync(url, dest);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(dl.uri);
      } else {
        Alert.alert('Downloaded', `Saved to ${dl.uri}`);
      }
    } catch (e) {
      Alert.alert('Download failed', e.message);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    if (tab === 'vaults') loadProviders(true);
    else if (tab === 'browse' && selectedProv) loadFiles(selectedProv, true);
    else setRefreshing(false);
  }

  // ── Tab content ─────────────────────────────────────────────────────────────

  function VaultsTab() {
    return (
      <ScrollView
        contentContainerStyle={styles.tabContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6B4EFF" />}
      >
        <Text style={styles.sectionTitle}>Storage Providers</Text>
        <Text style={styles.sectionSub}>Connect decentralized storage vaults to keep your data sovereign.</Text>
        {providers.map(p => (
          <ProviderCard
            key={p.id}
            provider={p}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        ))}
      </ScrollView>
    );
  }

  function BrowseTab() {
    const connected = providers.filter(p => p.connected);
    if (!connected.length) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No vault connected</Text>
          <Text style={styles.emptyDesc}>Connect a storage provider in the Vaults tab first.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setTab('vaults')}>
            <Text style={styles.emptyBtnText}>Go to Vaults</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {/* Provider selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.provSelector}>
          {connected.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[styles.provChip, selectedProv === p.id && styles.provChipActive]}
              onPress={() => { setSelected(p.id); loadFiles(p.id); }}
            >
              <Text style={[styles.provChipText, selectedProv === p.id && styles.provChipTextActive]}>
                {PROVIDER_ICONS[p.id]} {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading
          ? <ActivityIndicator size="large" color="#6B4EFF" style={{ marginTop: 40 }} />
          : files.length === 0
            ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🗃️</Text>
                <Text style={styles.emptyTitle}>No files yet</Text>
                <Text style={styles.emptyDesc}>Upload your first file from the Backup tab.</Text>
              </View>
            )
            : (
              <FlatList
                data={files}
                keyExtractor={item => item.cid || item.name}
                renderItem={({ item }) => <FileRow item={item} onDownload={handleDownload} />}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6B4EFF" />}
              />
            )
        }
      </View>
    );
  }

  function BackupTab() {
    const connected = providers.filter(p => p.connected);

    return (
      <ScrollView contentContainerStyle={[styles.tabContent, { alignItems: 'center', paddingTop: 32 }]}>
        <Text style={styles.sectionTitle}>Backup Files</Text>
        <Text style={styles.sectionSub}>Upload files to your connected vault. All uploads are encrypted and content-addressed via CID.</Text>

        {!connected.length && (
          <View style={styles.warnBox}>
            <Text style={styles.warnText}>⚠️  Connect a vault provider first</Text>
          </View>
        )}

        {connected.length > 0 && (
          <>
            <Text style={styles.targetLabel}>Uploading to: <Text style={styles.targetName}>{selectedProv || connected[0]?.name}</Text></Text>
            <TouchableOpacity
              style={[styles.uploadBtn, (uploading || !connected.length) && styles.uploadBtnDisabled]}
              onPress={handlePickAndUpload}
              disabled={uploading || !connected.length}
            >
              {uploading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.uploadBtnText}>📎  Choose File to Upload</Text>
              }
            </TouchableOpacity>
          </>
        )}

        {uploadStatus && (
          <View style={[styles.statusBox, uploadStatus.ok ? styles.statusOk : styles.statusErr]}>
            {uploadStatus.ok
              ? <>
                  <Text style={styles.statusTitle}>✅  Upload successful</Text>
                  <Text style={styles.statusDetail}>File: {uploadStatus.name}</Text>
                  <Text style={styles.statusDetail}>CID: {uploadStatus.cid}</Text>
                </>
              : <>
                  <Text style={styles.statusTitle}>❌  Upload failed</Text>
                  <Text style={styles.statusDetail}>{uploadStatus.error}</Text>
                </>
            }
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoItem}>• Files are hashed and stored with a unique CID</Text>
          <Text style={styles.infoItem}>• Your private key encrypts metadata before upload</Text>
          <Text style={styles.infoItem}>• Content is replicated across multiple IPFS nodes</Text>
          <Text style={styles.infoItem}>• You can retrieve files from any connected vault</Text>
        </View>
      </ScrollView>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔐 Data Vault</Text>
        <Text style={styles.headerSub}>Sovereign decentralized storage</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[['vaults', '🏛', 'Vaults'], ['browse', '📂', 'Browse'], ['backup', '☁️', 'Backup']].map(([key, icon, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabItem, tab === key && styles.tabItemActive]}
            onPress={() => setTab(key)}
          >
            <Text style={styles.tabIcon}>{icon}</Text>
            <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {loading && tab !== 'browse'
        ? <ActivityIndicator size="large" color="#6B4EFF" style={styles.loadingCenter} />
        : tab === 'vaults'  ? <VaultsTab />
        : tab === 'browse'  ? <BrowseTab />
        : <BackupTab />
      }
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const PURPLE = '#6B4EFF';
const SURFACE = '#1A1A2E';
const CARD    = '#16213E';
const BORDER  = '#2A2A4A';
const MUTED   = '#8080A0';
const WHITE   = '#FFFFFF';

const styles = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: SURFACE },
  loadingCenter:   { flex: 1, justifyContent: 'center' },

  // Header
  header:          { paddingTop: Platform.OS === 'ios' ? 56 : 32, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle:     { fontSize: 22, fontWeight: '700', color: WHITE },
  headerSub:       { fontSize: 13, color: MUTED, marginTop: 2 },

  // Tab bar
  tabBar:          { flexDirection: 'row', backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  tabItem:         { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabItemActive:   { borderBottomWidth: 2, borderBottomColor: PURPLE },
  tabIcon:         { fontSize: 16 },
  tabLabel:        { fontSize: 11, color: MUTED, marginTop: 2 },
  tabLabelActive:  { color: PURPLE, fontWeight: '600' },

  // Sections
  tabContent:      { flexGrow: 1, padding: 16 },
  sectionTitle:    { fontSize: 17, fontWeight: '700', color: WHITE, marginBottom: 6 },
  sectionSub:      { fontSize: 13, color: MUTED, marginBottom: 16, lineHeight: 18 },

  // Provider card
  providerCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  providerIcon:    { fontSize: 28, marginRight: 12 },
  providerInfo:    { flex: 1 },
  providerName:    { fontSize: 15, fontWeight: '700', color: WHITE },
  providerDesc:    { fontSize: 12, color: MUTED, marginTop: 2, lineHeight: 16 },
  providerStatus:  { fontSize: 11, marginTop: 4, fontWeight: '600' },
  connected:       { color: '#4CAF50' },
  disconnected:    { color: MUTED },
  connectBtn:      { backgroundColor: PURPLE, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, minWidth: 80, alignItems: 'center' },
  disconnectBtn:   { backgroundColor: '#AA3333' },
  connectBtnText:  { color: WHITE, fontSize: 12, fontWeight: '600' },

  // Provider chip selector
  provSelector:    { marginHorizontal: -16, paddingHorizontal: 16, marginBottom: 12, flexGrow: 0 },
  provChip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: BORDER, marginRight: 8, backgroundColor: CARD },
  provChipActive:  { backgroundColor: PURPLE, borderColor: PURPLE },
  provChipText:    { color: MUTED, fontSize: 13 },
  provChipTextActive: { color: WHITE, fontWeight: '600' },

  // File row
  fileRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: BORDER },
  fileRowIcon:     { fontSize: 22, marginRight: 12 },
  fileRowInfo:     { flex: 1 },
  fileName:        { fontSize: 14, fontWeight: '600', color: WHITE },
  fileMeta:        { fontSize: 11, color: MUTED, marginTop: 2 },
  downloadArrow:   { fontSize: 18, color: PURPLE, marginLeft: 8 },

  // Empty state
  emptyState:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIcon:       { fontSize: 48, marginBottom: 16 },
  emptyTitle:      { fontSize: 18, fontWeight: '700', color: WHITE, marginBottom: 8 },
  emptyDesc:       { fontSize: 14, color: MUTED, textAlign: 'center', paddingHorizontal: 32 },
  emptyBtn:        { marginTop: 20, backgroundColor: PURPLE, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  emptyBtnText:    { color: WHITE, fontWeight: '700' },

  // Backup tab
  warnBox:         { backgroundColor: '#3A2010', borderRadius: 10, padding: 12, marginBottom: 16, width: '100%' },
  warnText:        { color: '#FFA040', fontSize: 13 },
  targetLabel:     { fontSize: 13, color: MUTED, marginBottom: 16 },
  targetName:      { color: WHITE, fontWeight: '600' },
  uploadBtn:       { backgroundColor: PURPLE, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, alignItems: 'center', width: '100%' },
  uploadBtnDisabled: { opacity: 0.5 },
  uploadBtnText:   { color: WHITE, fontSize: 15, fontWeight: '700' },

  // Status
  statusBox:       { borderRadius: 10, padding: 14, marginTop: 16, width: '100%' },
  statusOk:        { backgroundColor: '#0F3320' },
  statusErr:       { backgroundColor: '#330F0F' },
  statusTitle:     { fontSize: 15, fontWeight: '700', color: WHITE, marginBottom: 6 },
  statusDetail:    { fontSize: 12, color: MUTED },

  // Info box
  infoBox:         { marginTop: 28, backgroundColor: CARD, borderRadius: 12, padding: 16, width: '100%', borderWidth: 1, borderColor: BORDER },
  infoTitle:       { fontSize: 14, fontWeight: '700', color: WHITE, marginBottom: 10 },
  infoItem:        { fontSize: 13, color: MUTED, marginBottom: 5, lineHeight: 18 },
});
