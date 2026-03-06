/**
 * CIVITAS Data Vault — Frontend Service
 *
 * Manages provider credentials in localStorage (keyed by wallet address).
 * Credentials are stored client-side only — never sent to the CIVITAS backend
 * persistently. They're only attached as request headers when making API calls.
 *
 * Storage key: civitas_vault_connections_{walletAddress}
 * Value: { [providerId]: { connected: bool, creds: {...}, connectedAt: timestamp } }
 */

const API = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3001';

// ─── Credential Storage (localStorage) ───────────────────────────────────────

function storageKey(walletAddress) {
  return `civitas_vault_connections_${(walletAddress || 'anon').toLowerCase()}`;
}

export function loadConnections(walletAddress) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(walletAddress)) || '{}');
  } catch {
    return {};
  }
}

export function saveConnection(walletAddress, providerId, creds) {
  const all = loadConnections(walletAddress);
  all[providerId] = { connected: true, creds, connectedAt: new Date().toISOString() };
  localStorage.setItem(storageKey(walletAddress), JSON.stringify(all));
}

export function removeConnection(walletAddress, providerId) {
  const all = loadConnections(walletAddress);
  delete all[providerId];
  localStorage.setItem(storageKey(walletAddress), JSON.stringify(all));
}

export function getCredentials(walletAddress, providerId) {
  return loadConnections(walletAddress)[providerId]?.creds || null;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

function vaultHeaders(providerId, creds) {
  return {
    'Content-Type':        'application/json',
    'x-vault-provider':    providerId,
    'x-vault-credentials': JSON.stringify(creds)
  };
}

/**
 * Fetch the static provider catalog from the backend.
 */
export async function fetchProviders() {
  const res = await fetch(`${API}/api/datavault/providers`);
  if (!res.ok) throw new Error('Failed to fetch providers');
  const data = await res.json();
  return data.providers;
}

/**
 * Test credentials for a provider.
 * @returns {{ ok: boolean, message: string, usage?: object }}
 */
export async function verifyConnection(providerId, creds) {
  const res = await fetch(`${API}/api/datavault/verify`, {
    method: 'POST',
    headers: vaultHeaders(providerId, creds),
    body: JSON.stringify({ credentials: creds, provider: providerId })
  });
  return res.json();
}

/**
 * Upload a File object to a provider.
 * @returns {{ success, cid, url, size, provider }}
 */
export async function uploadFileToVault(providerId, creds, file, onProgress) {
  const form = new FormData();
  form.append('file', file, file.name);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (onProgress) {
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }
    xhr.addEventListener('load', () => {
      try { resolve(JSON.parse(xhr.responseText)); }
      catch { reject(new Error('Invalid response')); }
    });
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.open('POST', `${API}/api/datavault/upload`);
    xhr.setRequestHeader('x-vault-provider',    providerId);
    xhr.setRequestHeader('x-vault-credentials', JSON.stringify(creds));
    xhr.send(form);
  });
}

/**
 * Upload arbitrary JSON data (e.g. a CIVITAS backup) to a provider.
 */
export async function uploadJsonToVault(providerId, creds, data, filename) {
  const res = await fetch(`${API}/api/datavault/upload-json`, {
    method: 'POST',
    headers: vaultHeaders(providerId, creds),
    body: JSON.stringify({ data, filename, provider: providerId })
  });
  return res.json();
}

/**
 * List files stored in a provider.
 */
export async function listVaultFiles(providerId, creds) {
  const res = await fetch(`${API}/api/datavault/files?provider=${providerId}`, {
    headers: {
      'x-vault-provider':    providerId,
      'x-vault-credentials': JSON.stringify(creds)
    }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.files || [];
}

/**
 * Build a CIVITAS data export payload (profile, contacts, groups) from context state.
 */
export function buildCivitasBackup(wallet, profile, contacts, groups) {
  return {
    meta: {
      version:    '1.0',
      platform:   'CIVITAS',
      exportedAt: new Date().toISOString(),
      address:    wallet?.address
    },
    profile:  profile  || {},
    contacts: contacts || [],
    groups:   groups   || []
  };
}
