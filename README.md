# GPT-CLIK-EXTENSION
<div align="center">

<img src="icons/Group 8999.png" alt="GPT-CLIK logo" width="72" />

# GPT-CLIK

**Select text anywhere on the web. Send it straight to ChatGPT, Claude, or Gemini.**

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Install-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/gpt-clik/lnhiielclhpjakgeglpcfingehokhnfb)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen)](manifest.json)
[![License](https://img.shields.io/badge/license-unspecified-lightgrey)]()

</div>

---

## What it does

GPT-CLIK is a lightweight Chrome extension that removes the copy‑paste‑switch‑tab loop when you want an AI's take on something you're reading. Highlight any text on any webpage, trigger GPT-CLIK, and the text is delivered directly to the AI assistant of your choice — no manual pasting required.

## Features

- **One action, straight to your AI** — select text and send it to **ChatGPT**, **Claude**, or **Gemini** without leaving the page you're on.
- **Three right-click behaviors**, switchable from the popup:
  | Mode | What happens |
  |---|---|
  | **Instant Ask** | Selected text is sent immediately, no extra steps |
  | **Paste & Edit** | Selected text is pre-filled so you can tweak it before sending |
  | **Show Menu** | A right-click submenu lets you pick the action each time |
- **Keyboard shortcut** — trigger GPT-CLIK on the current selection with `Ctrl+Shift+L` (`Cmd+Shift+L` on Mac), without touching the mouse.
- **Choose your default assistant** — a dedicated AI Selection screen lets you set ChatGPT, Claude, or Gemini as the destination used by the right-click actions and the keyboard shortcut.
- **Light/dark theme** for the popup and settings UI.
- **No accounts, no API keys** — GPT-CLIK works through your existing logged-in session with each provider in the browser.

## Installation

### Option 1 — Chrome Web Store (recommended)

Install directly from the [Chrome Web Store listing](https://chromewebstore.google.com/detail/gpt-clik/lnhiielclhpjakgeglpcfingehokhnfb).

### Option 2 — Load unpacked (for development)

1. Clone the repo:
   ```bash
   git clone https://github.com/shouryashah05/GPT-CLIK-EXTENSION.git
   ```
2. Open `chrome://extensions` in Chrome (or any Chromium-based browser).
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the `GPT-CLIK-EXTENSION` folder.
5. Pin the GPT-CLIK icon to your toolbar for quick access.

> Requires Chrome (or a Chromium-based browser) **114+**, per `minimum_chrome_version` in the manifest.

## Usage

1. Highlight any text on a webpage.
2. Trigger GPT-CLIK by:
   - right-clicking the selection, or
   - pressing `Ctrl+Shift+L` / `Cmd+Shift+L`.
3. Depending on your chosen **right-click behavior** (see below), the text is sent instantly, opened for editing first, or offered as a submenu choice.
4. A tab/window for your selected AI provider (ChatGPT, Claude, or Gemini) opens or activates with your text ready to go.

### Setting your default AI

1. Click the GPT-CLIK toolbar icon to open the popup.
2. Select **Selected AI** to open the AI Selection screen.
3. Pick **ChatGPT**, **Claude**, or **Gemini** — this becomes the destination for all right-click and keyboard-shortcut actions.

### Changing right-click behavior

In the popup, under **Right-click behavior**, choose one of:
- **Instant Ask** — fire-and-forget, fastest option.
- **Paste & Edit** — best when you want to add context or a follow-up question before sending.
- **Show Menu** — best if you switch between behaviors often.

### Customizing the keyboard shortcut

Chrome lets you remap the default shortcut at `chrome://extensions/shortcuts`.

## Permissions — why GPT-CLIK asks for them

| Permission | Purpose |
|---|---|
| `contextMenus` | Adds the right-click entry/submenu for sending selected text |
| `scripting` | Injects the logic that fills and submits your text on the destination site |
| `activeTab` | Reads the text you've selected on the page you're currently viewing |
| `storage` | Remembers your chosen AI provider and right-click behavior mode |
| Host access to `chatgpt.com`, `chat.openai.com`, `claude.ai`, `gemini.google.com` | Needed so the content script can deliver your selected text into the right chat interface |

GPT-CLIK doesn't collect, transmit, or store your browsing data anywhere outside your own browser — it simply relays your selection to a tab of the AI provider you're already signed into.

## Project structure

```
GPT-CLIK-EXTENSION/
├── manifest.json         # MV3 config: permissions, commands, content scripts
├── background.js         # Context menu setup, keyboard command handling, routing
├── content.js            # Injected into ChatGPT/Claude/Gemini to deliver & submit text
├── popup.html / popup.js / popup.css   # Toolbar popup — mode switch, AI shortcut, theme
├── ai-selection.html / ai-selection.js # Default AI picker (ChatGPT / Claude / Gemini)
├── settings.html / settings.js         # Extension options page
├── shared/                # Shared helpers/constants used across scripts
├── icons/                 # Extension icons
└── tailwind.min.css       # Styling for popup and settings UI
```

## Tech stack

- **Manifest V3** Chrome extension (service worker background script)
- Vanilla JavaScript, loaded as ES modules
- **Tailwind CSS** for the popup and AI-selection UI

## Browser support

Any Chromium-based browser supporting Manifest V3 and Chrome 114+ (Chrome, Edge, Brave, etc.).

## Contributing

Issues and pull requests are welcome — fork the repo, make your changes, and open a PR against `main`.

## Support the project

- ⭐ [Star it on GitHub](https://github.com/shouryashah05/GPT-CLIK-EXTENSION)
- ☕ [Buy the author a coffee](https://www.buymeacoffee.com/shouryashah)

## License

[MIT License](https://opensource.org/license/MIT)

Copyright (c) 2026 Shourya Shah 


Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.



**GPT CLIK is a chatgpt search extension where selected text is directly searched.**
