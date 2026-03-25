import { AI_LABELS, STORAGE_KEYS } from "./shared/constants.js";
import { getPreferences, updatePreference } from "./shared/storage.js";
import { initializeTheme, toggleTheme } from "./shared/theme.js";

const themeToggleButton = document.getElementById("themeToggle");
const backButton = document.getElementById("backButton");
const settingsButton = document.getElementById("settingsButton");
const homeLogoButton = document.getElementById("homeLogoButton");
const aiButtons = Array.from(document.querySelectorAll("[data-ai]"));
const selectionState = document.getElementById("selectionState");

let selectedAI = null;

document.addEventListener("DOMContentLoaded", async () => {
  requestAnimationFrame(() => {
    document.body.classList.add("is-ready");
  });

  const theme = await initializeTheme();
  renderThemeIcon(theme);

  const preferences = await getPreferences();
  selectedAI = preferences[STORAGE_KEYS.selectedAI];
  renderSelectedAI();

  selectionState.textContent = `Currently selected: ${AI_LABELS[selectedAI]}`;

  themeToggleButton.addEventListener("click", async () => {
    const nextTheme = await toggleTheme();
    renderThemeIcon(nextTheme);
  });

  backButton.addEventListener("click", () => {
    navigateTo("popup.html");
  });

  settingsButton.addEventListener("click", () => {
    navigateTo("settings.html");
  });

  homeLogoButton.addEventListener("click", () => {
    navigateTo("popup.html");
  });

  for (const button of aiButtons) {
    button.addEventListener("click", async () => {
      const nextAI = button.dataset.ai;
      if (!nextAI || nextAI === selectedAI) {
        return;
      }

      selectedAI = nextAI;
      await updatePreference({ [STORAGE_KEYS.selectedAI]: selectedAI });
      await notifyMenuRefresh();
      renderSelectedAI();
      selectionState.textContent = `Saved: ${AI_LABELS[selectedAI]}`;
    });
  }
});

function renderSelectedAI() {
  for (const button of aiButtons) {
    const isActive = button.dataset.ai === selectedAI;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function renderThemeIcon(themeMode) {
  const isDark = themeMode === "dark";

  themeToggleButton.innerHTML = isDark
    ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
    : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
}

async function notifyMenuRefresh() {
  try {
    await chrome.runtime.sendMessage({ type: "GPT_CLIK_REFRESH_MENUS" });
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
