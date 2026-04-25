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
