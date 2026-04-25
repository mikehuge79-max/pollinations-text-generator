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

// ── DOM: form controls ──────────────────────────────────
const promptInput   = document.getElementById('prompt');
const modelSelect   = document.getElementById('model');
const wordCountInput = document.getElementById('word-count');
const toneInput     = document.getElementById('tone');
const languageInput = document.getElementById('language');
const generateBtn   = document.getElementById('generate-btn');
const btnText       = document.getElementById('btn-text');
const btnLoading    = document.getElementById('btn-loading');

// ── Tone preset chips ───────────────────────────────────
const TONE_PRESETS = [
  'Professional', 'Casual', 'Formal', 'Friendly',
  'Persuasive', 'Academic', 'Humorous', 'Poetic',
  'Technical', 'Inspirational',
];

const tonePresetsEl = document.getElementById('tone-presets');

TONE_PRESETS.forEach(tone => {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.textContent = tone;
  chip.style.cssText = `
    background: var(--clr-bg);
    border: 1px solid var(--clr-border);
    color: var(--clr-muted);
    padding: .25rem .65rem;
    font-size: .75rem;
    border-radius: 99px;
    cursor: pointer;
    transition: .15s;
  `;
  chip.addEventListener('mouseenter', () => { chip.style.borderColor = 'var(--clr-accent)'; chip.style.color = 'var(--clr-accent)'; });
  chip.addEventListener('mouseleave', () => { chip.style.borderColor = 'var(--clr-border)'; chip.style.color = 'var(--clr-muted)'; });
  chip.addEventListener('click', () => {
    toneInput.value = tone.toLowerCase();
    // Highlight active chip
    tonePresetsEl.querySelectorAll('button').forEach(b => { b.style.background = 'var(--clr-bg)'; });
    chip.style.background = 'rgba(52,211,153,.12)';
    chip.style.borderColor = 'var(--clr-accent)';
    chip.style.color = 'var(--clr-accent)';
  });
  tonePresetsEl.appendChild(chip);
});

// ── DOM: output ─────────────────────────────────────────
const placeholder   = document.getElementById('placeholder');
const loadingBox    = document.getElementById('loading-box');
const textResult    = document.getElementById('text-result');
const textOutput    = document.getElementById('text-output');
const wordCounter   = document.getElementById('word-counter');
const errorBox      = document.getElementById('error-box');
const errorMsg      = document.getElementById('error-msg');
const copyBtn       = document.getElementById('copy-btn');
const downloadBtn   = document.getElementById('download-btn');

function showOutput(state) {
  placeholder.classList.toggle('hidden', state !== 'placeholder');
  loadingBox.classList.toggle('hidden',  state !== 'loading');
  textResult.classList.toggle('hidden',  state !== 'text');
  errorBox.classList.toggle('hidden',    state !== 'error');
}

function showError(msg) {
  errorMsg.textContent = msg;
  showOutput('error');
}

function setLoading(active) {
  generateBtn.disabled = active;
  btnText.classList.toggle('hidden', active);
  btnLoading.classList.toggle('hidden', !active);
}

function updateWordCounter(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  wordCounter.textContent = `${words.toLocaleString()} words · ${chars.toLocaleString()} chars`;
}

// ── Build system prompt ─────────────────────────────────
function buildSystemPrompt(wordCount, tone, language) {
  const lang     = language?.trim() || 'English';
  const toneText = tone?.trim()     || 'professional';

  return [
    `You are a professional ${toneText} writer.`,
    `Write all responses in ${lang}.`,
    `Target length: approximately ${wordCount} words.`,
    `Tone: ${toneText}.`,
    `Produce only the final written content — no meta-commentary, no "Here is your text:", no quotation marks around the output.`,
    `Format with proper paragraphs. Use markdown headings only if the content genuinely benefits from structure.`,
  ].join(' ');
}
