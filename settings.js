import { STORAGE_KEYS, SUPPORTED_CHAT_HOSTS, THEME_MODES } from "./shared/constants.js";
import { getPreferences, updatePreference } from "./shared/storage.js";
import { initializeTheme, toggleTheme } from "./shared/theme.js";

const themeToggleButton = document.getElementById("themeToggle");
const backButton = document.getElementById("backButton");
const homeLogoButton = document.getElementById("homeLogoButton");
const themeSwitchButton = document.getElementById("themeSwitch");
const themeState = document.getElementById("themeState");
const shortcutButton = document.getElementById("shortcutButton");
const chatModeSwitch = document.getElementById("chatModeSwitch");
const chatUrlInput = document.getElementById("chatUrlInput");
const saveChatUrlButton = document.getElementById("saveChatUrlButton");
const chatUrlStatus = document.getElementById("chatUrlStatus");

const SUPPORTED_CHAT_HOSTS_SET = new Set(SUPPORTED_CHAT_HOSTS);

let savedChatEnabled = false;

document.addEventListener("DOMContentLoaded", async () => {
  requestAnimationFrame(() => {
    document.body.classList.add("is-ready");
  });

  const theme = await initializeTheme();
  renderThemeState(theme);
  renderThemeIcon(theme);

  const preferences = await getPreferences();
  savedChatEnabled = Boolean(preferences[STORAGE_KEYS.customChatEnabled]);
  chatUrlInput.value = preferences[STORAGE_KEYS.customChatUrl] || "";
  renderSavedChatMode();

  themeToggleButton.addEventListener("click", async () => {
    const nextTheme = await toggleTheme();
    renderThemeState(nextTheme);
    renderThemeIcon(nextTheme);
  });

  themeSwitchButton.addEventListener("click", async () => {
    const nextTheme = await toggleTheme();
    renderThemeState(nextTheme);
    renderThemeIcon(nextTheme);
  });

  shortcutButton.addEventListener("click", () => {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });

  backButton.addEventListener("click", () => {
    navigateTo("popup.html");
  });

  homeLogoButton.addEventListener("click", () => {
    navigateTo("popup.html");
  });

  chatModeSwitch.addEventListener("click", async () => {
    if (!savedChatEnabled) {
      const parsedUrl = parseSupportedChatUrl(chatUrlInput.value);
      if (!parsedUrl) {
        chatUrlStatus.textContent = "Enter a valid ChatGPT, Claude, or Gemini chat URL first.";
        return;
      }
    }

    savedChatEnabled = !savedChatEnabled;
    await updatePreference({ [STORAGE_KEYS.customChatEnabled]: savedChatEnabled });
    await notifyMenuRefresh();
    renderSavedChatMode();
    chatUrlStatus.textContent = savedChatEnabled ? "Saved chat mode enabled." : "Saved chat mode disabled.";
  });

  saveChatUrlButton.addEventListener("click", async () => {
    const parsedUrl = parseSupportedChatUrl(chatUrlInput.value);
    if (!parsedUrl) {
      chatUrlStatus.textContent = "URL must be from chatgpt.com, claude.ai, or gemini.google.com.";
      return;
    }

    chatUrlInput.value = parsedUrl;
    await updatePreference({ [STORAGE_KEYS.customChatUrl]: parsedUrl });
    await notifyMenuRefresh();
    chatUrlStatus.textContent = "Chat link saved.";
  });
});

function renderThemeState(themeMode) {
  const isDark = themeMode === THEME_MODES.dark;
  themeState.textContent = isDark ? "Dark mode" : "Light mode";
  themeSwitchButton.classList.toggle("is-active", isDark);
}

function renderThemeIcon(themeMode) {
  const isDark = themeMode === THEME_MODES.dark;

  themeToggleButton.innerHTML = isDark
    ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
    : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
}

function renderSavedChatMode() {
  chatModeSwitch.classList.toggle("is-active", savedChatEnabled);
}

function parseSupportedChatUrl(rawValue) {
  try {
    const url = new URL((rawValue || "").trim());
    if (url.protocol !== "https:" || !SUPPORTED_CHAT_HOSTS_SET.has(url.hostname)) {
      return null;
    }

    return url.toString();
  } catch (error) {
    return null;
  }
}

async function notifyMenuRefresh() {
  try {
    await chrome.runtime.sendMessage({ type: "CLIK_GPT_REFRESH_MENUS" });
  } catch (error) {
    // Ignore transient service worker wake-up errors.
  }
}

function navigateTo(url) {
  document.body.classList.add("is-leaving");
  window.setTimeout(() => {
    window.location.href = url;
  }, 120);
}
