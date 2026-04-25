/**
 * Pollinations Text Generator
 * app.js — API key management + obfuscation
 */

// ── Constants ───────────────────────────────────────────
const STORAGE_KEY = '__ptg_k';
const XOR_SEED    = 0x7B;

// ── Key encoding / decoding ─────────────────────────────
function encodeKey(rawKey) {
  const bytes = Array.from(rawKey).map(c => c.charCodeAt(0) ^ XOR_SEED);
  return btoa(String.fromCharCode(...bytes));
}

function decodeKey(encoded) {
  try {
    const chars = atob(encoded);
    return Array.from(chars).map(c => String.fromCharCode(c.charCodeAt(0) ^ XOR_SEED)).join('');
  } catch { return null; }
}

function saveApiKey(rawKey) { localStorage.setItem(STORAGE_KEY, encodeKey(rawKey)); }
function loadApiKey()       { const s = localStorage.getItem(STORAGE_KEY); return s ? decodeKey(s) : null; }
function clearApiKey()      { localStorage.removeItem(STORAGE_KEY); }

function maskKey(key) {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 6) + '••••' + key.slice(-4);
}

// ── DOM references ──────────────────────────────────────
const setupScreen  = document.getElementById('setup-screen');
const mainApp      = document.getElementById('main-app');
const apiKeyInput  = document.getElementById('api-key-input');
const saveKeyBtn   = document.getElementById('save-key-btn');
const resetKeyBtn  = document.getElementById('reset-key-btn');
const keyError     = document.getElementById('key-error');
const keyBadge     = document.getElementById('key-badge');

function showSetupScreen() {
  setupScreen.classList.remove('hidden');
  mainApp.classList.add('hidden');
  apiKeyInput.value = '';
}

function showMainApp(key) {
  setupScreen.classList.add('hidden');
  mainApp.classList.remove('hidden');
  keyBadge.textContent = '🔑 ' + maskKey(key);
}

function isValidKey(key) { return typeof key === 'string' && key.trim().length >= 6; }

saveKeyBtn.addEventListener('click', () => {
  const raw = apiKeyInput.value.trim();
  if (!isValidKey(raw)) {
    keyError.textContent = 'Please enter a valid API key (minimum 6 characters).';
    keyError.style.display = 'block';
    return;
  }
  keyError.style.display = 'none';
  saveApiKey(raw);
  apiKeyInput.value = '';
  showMainApp(raw);
});

apiKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveKeyBtn.click(); });
resetKeyBtn.addEventListener('click', () => { clearApiKey(); showSetupScreen(); });

(function init() {
  const key = loadApiKey();
  if (key) showMainApp(key); else showSetupScreen();
})();
