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

// ── Call Pollinations text API ─────────────────────────
async function callPollinationsText({ model, systemPrompt, userPrompt, apiKey }) {
  const response = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      temperature: 0.75,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    let detail = '';
    try { detail = JSON.parse(body)?.error?.message || body; } catch { detail = body; }
    throw new Error(`API error ${response.status}: ${detail || response.statusText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from API. Please try again.');
  return content;
}

// ── Generate text ──────────────────────────────────────
async function generateText() {
  const prompt    = promptInput.value.trim();
  const wordCount = parseInt(wordCountInput.value) || 300;
  const tone      = toneInput.value.trim()      || 'professional';
  const language  = languageInput.value.trim()  || 'English';
  const model     = modelSelect.value;

  if (!prompt) { showError('Please enter a prompt before generating.'); return; }

  const apiKey = loadApiKey();
  if (!apiKey) { clearApiKey(); showSetupScreen(); return; }

  setLoading(true);
  showOutput('loading');

  try {
    const systemPrompt = buildSystemPrompt(wordCount, tone, language);
    const text = await callPollinationsText({ model, systemPrompt, userPrompt: prompt, apiKey });

    textOutput.textContent = text;
    updateWordCounter(text);
    showOutput('text');
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

generateBtn.addEventListener('click', generateText);
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !generateBtn.disabled) generateText();
});

// ── Copy to clipboard ───────────────────────────────────
copyBtn.addEventListener('click', async () => {
  const text = textOutput.textContent;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    const original = copyBtn.textContent;
    copyBtn.textContent = '✅ Copied!';
    copyBtn.style.color = 'var(--clr-accent)';
    setTimeout(() => { copyBtn.textContent = original; copyBtn.style.color = ''; }, 2000);
  } catch {
    // Fallback for browsers that restrict clipboard
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copyBtn.textContent = '✅ Copied!';
    setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
  }
});

// ── Download as .txt ────────────────────────────────────
downloadBtn.addEventListener('click', () => {
  const text = textOutput.textContent;
  if (!text) return;

  const blob     = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url      = URL.createObjectURL(blob);
  const filename = `pollinations-text-${Date.now()}.txt`;

  const a = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ── Model descriptions ──────────────────────────────────
const MODEL_INFO = {
  'openai':     'GPT-4o by OpenAI — industry-leading quality for all writing tasks.',
  'claude':     'Claude 3.5 Sonnet — nuanced, thoughtful writing with great style.',
  'gemini':     'Gemini 2.0 Flash — fast, creative, great for varied content.',
  'mistral':    'Mistral — concise, clean, efficient European LLM.',
  'llama':      'LLaMA — Meta\'s open-source model, solid general performance.',
  'command-r':  'Command R — optimized for instruction-following and RAG.',
};

const modelInfo = document.createElement('p');
modelInfo.style.cssText = 'font-size:.74rem;color:var(--clr-muted);margin-top:.35rem;min-height:1.1em;';
modelSelect.parentElement.appendChild(modelInfo);

function updateModelInfo() { modelInfo.textContent = MODEL_INFO[modelSelect.value] || ''; }
modelSelect.addEventListener('change', updateModelInfo);
updateModelInfo();

// ── Word count validation ───────────────────────────────
wordCountInput.addEventListener('blur', () => {
  let v = parseInt(wordCountInput.value) || 300;
  v = Math.max(50, Math.min(3000, v));
  wordCountInput.value = v;
});

// ── Prompt character counter ────────────────────────────
const charCounter = document.createElement('small');
charCounter.style.cssText = 'float:right;font-size:.7rem;color:var(--clr-muted);';
promptInput.parentElement.querySelector('label').appendChild(charCounter);
promptInput.addEventListener('input', () => {
  const l = promptInput.value.length;
  charCounter.textContent = `${l} / 800`;
  charCounter.style.color = l > 700 ? 'var(--clr-error)' : 'var(--clr-muted)';
});
charCounter.textContent = '0 / 800';

// ── Typewriter display effect ───────────────────────────
/**
 * Renders text progressively with a blinking cursor.
 * Falls back to instant display if text is very long (>3000 chars).
 */
async function typewriterDisplay(text, targetEl) {
  targetEl.textContent = '';

  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  targetEl.appendChild(cursor);

  // Skip animation for very long texts (performance)
  if (text.length > 3000) {
    targetEl.textContent = text;
    updateWordCounter(text);
    return;
  }

  const CHUNK = 6;  // characters per frame
  let i = 0;

  await new Promise(resolve => {
    function step() {
      if (i < text.length) {
        const chunk = text.slice(0, i + CHUNK);
        targetEl.textContent = chunk;
        targetEl.appendChild(cursor);
        updateWordCounter(chunk);
        i += CHUNK;
        requestAnimationFrame(step);
      } else {
        cursor.remove();
        targetEl.textContent = text;
        updateWordCounter(text);
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

// Patch generateText to use typewriter
const _origGenerate = generateText;
// Override: re-define generateText to use typewriter on success
async function generateTextAnimated() {
  const prompt    = promptInput.value.trim();
  const wordCount = parseInt(wordCountInput.value) || 300;
  const tone      = toneInput.value.trim()      || 'professional';
  const language  = languageInput.value.trim()  || 'English';
  const model     = modelSelect.value;

  if (!prompt) { showError('Please enter a prompt before generating.'); return; }

  const apiKey = loadApiKey();
  if (!apiKey) { clearApiKey(); showSetupScreen(); return; }

  setLoading(true);
  showOutput('loading');

  try {
    const systemPrompt = buildSystemPrompt(wordCount, tone, language);
    const text = await callPollinationsText({ model, systemPrompt, userPrompt: prompt, apiKey });
    showOutput('text');
    await typewriterDisplay(text, textOutput);
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

// Replace click handler
generateBtn.removeEventListener('click', generateText);
generateBtn.addEventListener('click', generateTextAnimated);
document.removeEventListener('keydown', e => {});
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !generateBtn.disabled) generateTextAnimated();
});
