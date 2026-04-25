# 🌸 Pollinations Text Generator

A polished, browser-based AI writing assistant powered by the [Pollinations.ai](https://pollinations.ai) text API — no server, no build tools, just open and use.

## ✨ Features

| Feature | Details |
|---------|---------|
| 🔑 Secure key storage | XOR-obfuscated, base64-encoded in `localStorage` |
| 🤖 6 AI models | GPT-4o, Claude 3.5, Gemini 2.0, Mistral, LLaMA, Command R |
| 📏 Word count control | Injected into system prompt for precise length targeting |
| 🎭 Tone control | Free-text input + 10 quick-select preset chips |
| 🌍 Language selection | Generate in any language |
| ✍️ Typewriter animation | Smooth character-by-character reveal of output |
| 📋 Copy to clipboard | One-click with visual confirmation |
| ⬇️ Download as .txt | Auto-timestamped filename |
| ⌨️ Keyboard shortcut | `Ctrl / ⌘ + Enter` to generate |

## 🚀 Getting Started

1. **Get your API key** at [enter.pollinations.ai](https://enter.pollinations.ai) (free)
2. **Open** `index.html` directly in any modern browser — no server needed
3. **Paste** your publishable key (`pk_…`) into the setup screen
4. **Generate** — write a prompt, choose a model and style, hit ✍️ Generate

## 🔒 API Key Security

Your key is:
- Stored **only in your browser's `localStorage`** — never on any external server
- Obfuscated with XOR + base64 to prevent casual extraction from DevTools
- Cleared from the input field immediately after saving
- Shown only as a masked preview (e.g. `pk_12••••5678`)

Use your **publishable key** (`pk_…`) — it is safe for client-side use.  
Never paste a secret key (`sk_…`) into any browser app.

## 🖥️ API Used

```
POST https://text.pollinations.ai/openai
Authorization: Bearer pk_xxxx

{
  "model": "openai",
  "messages": [
    { "role": "system", "content": "You are a professional writer..." },
    { "role": "user",   "content": "User prompt here" }
  ],
  "temperature": 0.75
}
```

Full docs: [pollinations.ai API](https://github.com/pollinations/pollinations/blob/main/APIDOCS.md)

## 📁 Project Structure

```
pollinations-text-generator/
├── index.html   # App markup
├── style.css    # All styles
├── app.js       # App logic
└── README.md
```

## 🛠️ Tech Stack

Plain **HTML · CSS · Vanilla JS** · No build tools · No dependencies

## 📄 License

MIT — free to use, modify, and distribute.
