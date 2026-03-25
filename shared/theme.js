import { DEFAULT_PREFERENCES, STORAGE_KEYS, THEME_MODES } from "./constants.js";
import { updatePreference } from "./storage.js";

export function applyTheme(themeMode) {
  const normalized =
    themeMode === THEME_MODES.dark ? THEME_MODES.dark : DEFAULT_PREFERENCES[STORAGE_KEYS.theme];

  document.documentElement.setAttribute("data-theme", normalized);
  document.body.setAttribute("data-theme", normalized);

  return normalized;
}

export async function initializeTheme() {
  const result = await chrome.storage.sync.get({
    [STORAGE_KEYS.theme]: DEFAULT_PREFERENCES[STORAGE_KEYS.theme]
  });

  return applyTheme(result[STORAGE_KEYS.theme]);
}

export async function toggleTheme() {
  const currentMode =
    document.documentElement.getAttribute("data-theme") || DEFAULT_PREFERENCES[STORAGE_KEYS.theme];
  const nextMode = currentMode === THEME_MODES.dark ? THEME_MODES.light : THEME_MODES.dark;

  applyTheme(nextMode);
  await updatePreference({ [STORAGE_KEYS.theme]: nextMode });

  return nextMode;
}
