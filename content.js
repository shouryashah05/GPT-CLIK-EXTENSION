const MESSAGE_TYPE_INJECT = "CLIK_GPT_INJECT";

const SITE_CONFIG = [
  {
    matches: (host) => host === "chatgpt.com" || host === "chat.openai.com",
    inputSelectors: [
      "textarea#prompt-textarea",
      "textarea[data-id='root']",
      "textarea"
    ],
    sendSelectors: [
      "button[data-testid='send-button']",
      "button[aria-label='Send prompt']",
      "button[aria-label='Send message']"
    ]
  },
  {
    matches: (host) => host === "claude.ai",
    inputSelectors: [
      "div[contenteditable='true'][data-testid='chat-input']",
      "div.ProseMirror[contenteditable='true']",
      "div[contenteditable='true']"
    ],
    sendSelectors: [
      "button[aria-label='Send message']",
      "button[aria-label*='Send']"
    ]
  },
  {
    matches: (host) => host === "gemini.google.com",
    inputSelectors: [
      "rich-textarea div[contenteditable='true']",
      "div.ql-editor[contenteditable='true']",
      "textarea"
    ],
    sendSelectors: [
      "button[aria-label='Send message']",
      "button[aria-label*='Send']",
      "button[mattooltip*='Send']"
    ]
  }
];

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== MESSAGE_TYPE_INJECT) {
    return false;
  }

  injectPrompt(message.text || "", Boolean(message.autoSend))
    .then(() => {
      sendResponse({ ok: true });
    })
    .catch((error) => {
      sendResponse({ ok: false, error: error.message });
    });

  return true;
});

async function injectPrompt(text, autoSend) {
  const config = getSiteConfig();
  if (!config) {
    throw new Error("Unsupported AI website.");
  }

  const composer = await waitForComposer(config.inputSelectors);
  if (!composer) {
    throw new Error("Prompt input was not found.");
  }

  setComposerText(composer, text);

  if (!autoSend) {
    return;
  }

  await sleep(120);
  clickSendButton(config.sendSelectors, composer);
}

function getSiteConfig() {
  const host = window.location.hostname;
  return SITE_CONFIG.find((item) => item.matches(host));
}

function setComposerText(element, text) {
  element.focus();

  if (isTextAreaLike(element)) {
    element.value = text;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  // Preserve editor bindings by using insertText when available.
  const selection = window.getSelection();
  if (selection && typeof document.execCommand === "function") {
    document.execCommand("selectAll", false, null);
    document.execCommand("insertText", false, text);
  } else {
    element.textContent = text;
  }

  element.dispatchEvent(new InputEvent("input", { bubbles: true, data: text }));
}

function clickSendButton(sendSelectors, composer) {
  for (const selector of sendSelectors) {
    const button = document.querySelector(selector);
    if (button && !button.disabled) {
      button.click();
      return;
    }
  }

  const enterEvent = {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true
  };

  composer.dispatchEvent(new KeyboardEvent("keydown", enterEvent));
  composer.dispatchEvent(new KeyboardEvent("keypress", enterEvent));
  composer.dispatchEvent(new KeyboardEvent("keyup", enterEvent));
}

function isTextAreaLike(element) {
  return element.tagName === "TEXTAREA" || element.tagName === "INPUT";
}

async function waitForComposer(selectors, timeoutMs = 15000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && isVisible(element)) {
        return element;
      }
    }

    await sleep(200);
  }

  return null;
}

function isVisible(element) {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
