import { AI_LABELS, MODE_LABELS, STORAGE_KEYS } from "./shared/constants.js";
import { getPreferences, updatePreference } from "./shared/storage.js";
import { initializeTheme, toggleTheme } from "./shared/theme.js";

const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));

const modeLabel = document.getElementById("modeLabel");
const selectedAiLabel = document.getElementById("selectedAiLabel");
const aiSelectionButton = document.getElementById("aiSelectionButton");
const settingsButton = document.getElementById("settingsButton");
const themeToggleButton = document.getElementById("themeToggle");
const homeLogoButton = document.getElementById("homeLogoButton");

let selectedMode = null;
let selectedAI = null;
let customChatEnabled = false;

document.addEventListener("DOMContentLoaded", async () => {
  const theme = await initializeTheme();
  renderThemeIcon(theme);

  const preferences = await getPreferences();
  selectedMode = preferences[STORAGE_KEYS.selectedMode];
  selectedAI = preferences[STORAGE_KEYS.selectedAI];
  customChatEnabled = Boolean(preferences[STORAGE_KEYS.customChatEnabled]);

  renderModeState();
  renderAiState();
  renderModeInteractivity();

  for (const button of modeButtons) {
    button.addEventListener("click", async () => {
      const nextMode = button.dataset.mode;
      if (!nextMode || nextMode === selectedMode) {
        return;
      }

      if (customChatEnabled) {
        return;
      }

      selectedMode = nextMode;
      await updatePreference({ [STORAGE_KEYS.selectedMode]: selectedMode });
      await notifyMenuRefresh();
      renderModeState();
    });
  }

  themeToggleButton.addEventListener("click", async () => {
    const nextTheme = await toggleTheme();
    renderThemeIcon(nextTheme);
  });

  aiSelectionButton.addEventListener("click", () => {
    window.location.href = "ai-selection.html";
  });

  settingsButton.addEventListener("click", () => {
    window.location.href = "settings.html";
  });

  homeLogoButton.addEventListener("click", () => {
    window.location.href = "popup.html";
  });
});

function renderModeState() {
  modeLabel.textContent = customChatEnabled ? "Saved chat mode" : MODE_LABELS[selectedMode] || "";

  for (const button of modeButtons) {
    const isActive = button.dataset.mode === selectedMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function renderAiState() {
  selectedAiLabel.textContent = AI_LABELS[selectedAI] || "ChatGPT";
}

function renderThemeIcon(themeMode) {
  const isDark = themeMode === "dark";

  themeToggleButton.innerHTML = isDark
    ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
    : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
}

async function notifyMenuRefresh() {
  try {
    await chrome.runtime.sendMessage({ type: "CLIK_GPT_REFRESH_MENUS" });
  } catch (error) {
    // Ignore transient service worker wake-up errors.
  }
}

function renderModeInteractivity() {
  for (const button of modeButtons) {
    button.disabled = customChatEnabled;
    button.classList.toggle("is-disabled", customChatEnabled);
  }
}