import {
  AI_LABELS,
  INTERACTION_MODES,
  MODE_LABELS,
  RESTRICTED_SOURCE_HOST_KEYWORDS,
  STORAGE_KEYS
} from "./shared/constants.js";
import { contextMenuItemToProvider, getAiTarget } from "./shared/ai-targets.js";
import { ensureDefaults, getPreferences, updatePreference } from "./shared/storage.js";

const CONTEXT_SELECTION = ["selection"];

const MENU_IDS = {
  singleAction: "gptclik_action",
  parent: "gptclik_parent",
  showInstant: "gptclik_show_instant",
  showPasteEdit: "gptclik_show_paste_edit",
  chatgpt: "gptclik_ai_chatgpt",
  claude: "gptclik_ai_claude",
  gemini: "gptclik_ai_gemini"
};

const MESSAGE_TYPE_INJECT = "GPT_CLIK_INJECT";
const MESSAGE_TYPE_REFRESH_MENUS = "GPT_CLIK_REFRESH_MENUS";

let contextMenuRebuildQueue = Promise.resolve();

chrome.runtime.onInstalled.addListener(async () => {
  const preferences = await ensureDefaults();
  await queueContextMenuRebuild(preferences);
});

chrome.runtime.onStartup.addListener(async () => {
  const preferences = await ensureDefaults();
  await queueContextMenuRebuild(preferences);
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== "sync" && areaName !== "local") {
    return;
  }

  if (
    !changes[STORAGE_KEYS.selectedMode] &&
    !changes[STORAGE_KEYS.selectedAI] &&
    !changes[STORAGE_KEYS.customChatEnabled] &&
    !changes[STORAGE_KEYS.customChatUrl]
  ) {
    return;
  }

  await queueContextMenuRebuild();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== MESSAGE_TYPE_REFRESH_MENUS) {
    return false;
  }

  queueContextMenuRebuild()
    .then(() => {
      sendResponse({ ok: true });
    })
    .catch((error) => {
      sendResponse({ ok: false, error: error.message });
    });

  return true;
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  const selectedText = (info.selectionText || "").trim();
  if (!selectedText) {
    return;
  }

  if (isRestrictedSourceUrl(info.pageUrl || info.frameUrl || "")) {
    return;
  }

  const preferences = await getPreferences();

  // Saved chat mode takes priority over any menu state.
  if (isSavedChatModeEnabled(preferences)) {
    await openSavedChatWithText(preferences, selectedText);
    return;
  }

  if (info.menuItemId === MENU_IDS.singleAction) {
    const autoSend = preferences[STORAGE_KEYS.selectedMode] === INTERACTION_MODES.instant;
    await openAiWithText(preferences[STORAGE_KEYS.selectedAI], selectedText, autoSend);
    return;
  }

  if (info.menuItemId === MENU_IDS.showInstant) {
    await openAiWithText(preferences[STORAGE_KEYS.selectedAI], selectedText, true);
    return;
  }

  if (info.menuItemId === MENU_IDS.showPasteEdit) {
    await openAiWithText(preferences[STORAGE_KEYS.selectedAI], selectedText, false);
    return;
  }

  const provider = contextMenuItemToProvider(info.menuItemId);
  if (provider) {
    await openAiWithText(provider, selectedText, false);
  }
});

chrome.commands.onCommand.addListener(async (commandName) => {
  if (commandName !== "run-gpt-clik") {
    return;
  }

  const preferences = await getPreferences();
  const selectedText = await getSelectedTextFromActiveTab();

  if (isSavedChatModeEnabled(preferences)) {
    await openSavedChatWithText(preferences, selectedText);
    return;
  }

  if (!selectedText) {
    await chrome.tabs.create({ url: getAiTarget(preferences[STORAGE_KEYS.selectedAI]).url });
    return;
  }

  const preferredMode = preferences[STORAGE_KEYS.selectedMode];
  const effectiveMode =
    preferredMode === INTERACTION_MODES.showMenu ? INTERACTION_MODES.pasteEdit : preferredMode;
  const autoSend = effectiveMode === INTERACTION_MODES.instant;

  await openAiWithText(preferences[STORAGE_KEYS.selectedAI], selectedText, autoSend);
});

async function rebuildContextMenus(preferences) {
  await removeAllContextMenus();

  if (isSavedChatModeEnabled(preferences)) {
    await createContextMenu({
      id: MENU_IDS.singleAction,
      title: "GPT-CLIK: Send to saved chat",
      contexts: CONTEXT_SELECTION
    });

    return;
  }

  const selectedMode = preferences[STORAGE_KEYS.selectedMode];

  if (selectedMode === INTERACTION_MODES.showMenu) {
    const selectedAI = preferences[STORAGE_KEYS.selectedAI];
    const selectedAiLabel = AI_LABELS[selectedAI] || "ChatGPT";

    await createContextMenu({
      id: MENU_IDS.parent,
      title: "GPT-CLIK",
      contexts: CONTEXT_SELECTION
    });

    await createContextMenu({
      id: MENU_IDS.showInstant,
      parentId: MENU_IDS.parent,
      title: `Instant Ask (${selectedAiLabel})`,
      contexts: CONTEXT_SELECTION
    });

    await createContextMenu({
      id: MENU_IDS.showPasteEdit,
      parentId: MENU_IDS.parent,
      title: `Paste & Edit (${selectedAiLabel})`,
      contexts: CONTEXT_SELECTION
    });

    return;
  }

  const selectedAI = preferences[STORAGE_KEYS.selectedAI];
  const title = `GPT-CLIK: ${MODE_LABELS[selectedMode]} in ${AI_LABELS[selectedAI]}`;

  await createContextMenu({
    id: MENU_IDS.singleAction,
    title,
    contexts: CONTEXT_SELECTION
  });
}

async function openAiWithText(provider, text, autoSend) {
  const target = getAiTarget(provider);
  const newTab = await chrome.tabs.create({ url: target.url, active: true });

  if (!newTab || typeof newTab.id !== "number") {
    return;
  }

  await waitForTabToLoad(newTab.id);
  await sendInjectionMessage(newTab.id, text, autoSend);
}

async function openSavedChatWithText(preferences, text) {
  const customChatUrl = sanitizeSupportedChatUrl(preferences[STORAGE_KEYS.customChatUrl]);
  if (!customChatUrl) {
    // If mode is enabled but URL is invalid or not set, recover safely.
    await updatePreference({
      [STORAGE_KEYS.customChatEnabled]: false,
      [STORAGE_KEYS.customChatUrl]: ""
    });
    await chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
    return;
  }

  const tab = await getOrCreateSavedChatTab(customChatUrl);
  if (!tab || typeof tab.id !== "number") {
    return;
  }

  if (!text) {
    return;
  }

  await waitForTabToLoad(tab.id);

  // Saved chat mode is intentionally paste-only to avoid accidental sends.
  await sendInjectionMessage(tab.id, text, false);
}

async function getOrCreateSavedChatTab(targetUrl) {
  const normalizedTarget = normalizeUrl(targetUrl);
  const allTabs = await chrome.tabs.query({});
  const existing = allTabs.find((tab) => normalizeUrl(tab.url || "") === normalizedTarget);

  if (existing && typeof existing.id === "number") {
    return chrome.tabs.update(existing.id, { active: true });
  }

  return chrome.tabs.create({ url: targetUrl, active: true });
}

async function sendInjectionMessage(tabId, text, autoSend) {
  const payload = {
    type: MESSAGE_TYPE_INJECT,
    text,
    autoSend
  };

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, payload);
      if (response && response.ok) {
        return;
      }
    } catch (error) {
      // The content script may not be ready immediately after tab load.
    }

    await sleep(350);
  }
}

async function getSelectedTextFromActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || typeof tab.id !== "number") {
    return "";
  }

  if (isRestrictedSourceUrl(tab.url || "")) {
    return "";
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const activeElement = document.activeElement;

        if (
          activeElement &&
          (activeElement.tagName === "TEXTAREA" || activeElement.tagName === "INPUT")
        ) {
          const input = activeElement;
          const type = (input.type || "").toLowerCase();
          const name = (input.name || "").toLowerCase();
          const id = (input.id || "").toLowerCase();

          if (
            type === "password" ||
            type === "email" ||
            type === "tel" ||
            name.includes("token") ||
            name.includes("secret") ||
            name.includes("password") ||
            id.includes("token") ||
            id.includes("secret") ||
            id.includes("password")
          ) {
            return "";
          }

          const value = input.value || "";
          if (
            typeof input.selectionStart === "number" &&
            typeof input.selectionEnd === "number" &&
            input.selectionEnd > input.selectionStart
          ) {
            return value.slice(input.selectionStart, input.selectionEnd).trim();
          }
        }

        return (window.getSelection() || "").toString().trim();
      }
    });

    return (result && result.result ? String(result.result) : "").trim();
  } catch (error) {
    return "";
  }
}

function waitForTabToLoad(tabId, timeoutMs = 20000) {
  return new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => {
      if (!chrome.runtime.lastError && tab && tab.status === "complete") {
        resolve();
        return;
      }
    });

    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, timeoutMs);

    function listener(updatedTabId, info) {
      if (updatedTabId === tabId && info.status === "complete") {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}

function createContextMenu(createProperties) {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.create(createProperties, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

function removeAllContextMenus() {
  return new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => {
      resolve();
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSavedChatModeActive(preferences) {
  return isSavedChatModeEnabled(preferences) && Boolean(preferences[STORAGE_KEYS.customChatUrl]);
}

function isSavedChatModeEnabled(preferences) {
  return (
    Boolean(preferences[STORAGE_KEYS.customChatEnabled])
  );
}

function sanitizeSupportedChatUrl(rawUrl) {
  try {
    const parsed = new URL((rawUrl || "").trim());
    const isHttps = parsed.protocol === "https:";
    const isAllowedHost =
      parsed.hostname === "chatgpt.com" ||
      parsed.hostname === "chat.openai.com" ||
      parsed.hostname === "claude.ai" ||
      parsed.hostname === "gemini.google.com";

    if (!isHttps || !isAllowedHost) {
      return "";
    }

    return parsed.toString();
  } catch (error) {
    return "";
  }
}

function isRestrictedSourceUrl(rawUrl) {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return RESTRICTED_SOURCE_HOST_KEYWORDS.some((keyword) => host.includes(keyword));
  } catch (error) {
    return false;
  }
}

function normalizeUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch (error) {
    return "";
  }
}

function queueContextMenuRebuild(preferences) {
  contextMenuRebuildQueue = contextMenuRebuildQueue
    .catch(() => undefined)
    .then(async () => {
      const resolvedPreferences = preferences || (await getPreferences());
      await rebuildContextMenus(resolvedPreferences);
    });

  return contextMenuRebuildQueue;
}