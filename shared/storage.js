import {
  AI_PROVIDERS,
  DEFAULT_PREFERENCES,
  INTERACTION_MODES,
  STORAGE_KEYS,
  THEME_MODES
} from "./constants.js";

const VALID_AI_VALUES = new Set(Object.values(AI_PROVIDERS));
const VALID_MODE_VALUES = new Set(Object.values(INTERACTION_MODES));
const VALID_THEME_VALUES = new Set(Object.values(THEME_MODES));

const SYNC_DEFAULT_PREFERENCES = {
  [STORAGE_KEYS.selectedAI]: DEFAULT_PREFERENCES[STORAGE_KEYS.selectedAI],
  [STORAGE_KEYS.selectedMode]: DEFAULT_PREFERENCES[STORAGE_KEYS.selectedMode],
  [STORAGE_KEYS.theme]: DEFAULT_PREFERENCES[STORAGE_KEYS.theme],
  [STORAGE_KEYS.customChatEnabled]: DEFAULT_PREFERENCES[STORAGE_KEYS.customChatEnabled]
};

const LOCAL_DEFAULT_PREFERENCES = {
  [STORAGE_KEYS.customChatUrl]: DEFAULT_PREFERENCES[STORAGE_KEYS.customChatUrl]
};

function normalizeChatUrl(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePreferences(raw) {
  const next = { ...DEFAULT_PREFERENCES, ...raw };

  if (!VALID_AI_VALUES.has(next[STORAGE_KEYS.selectedAI])) {
    next[STORAGE_KEYS.selectedAI] = DEFAULT_PREFERENCES[STORAGE_KEYS.selectedAI];
  }

  if (!VALID_MODE_VALUES.has(next[STORAGE_KEYS.selectedMode])) {
    next[STORAGE_KEYS.selectedMode] = DEFAULT_PREFERENCES[STORAGE_KEYS.selectedMode];
  }

  if (!VALID_THEME_VALUES.has(next[STORAGE_KEYS.theme])) {
    next[STORAGE_KEYS.theme] = DEFAULT_PREFERENCES[STORAGE_KEYS.theme];
  }

  if (typeof next[STORAGE_KEYS.customChatEnabled] !== "boolean") {
    next[STORAGE_KEYS.customChatEnabled] = DEFAULT_PREFERENCES[STORAGE_KEYS.customChatEnabled];
  }

  next[STORAGE_KEYS.customChatUrl] = normalizeChatUrl(next[STORAGE_KEYS.customChatUrl]);

  return next;
}

export async function getPreferences() {
  const [syncRaw, localRaw] = await Promise.all([
    chrome.storage.sync.get(SYNC_DEFAULT_PREFERENCES),
    chrome.storage.local.get(LOCAL_DEFAULT_PREFERENCES)
  ]);

  return normalizePreferences({ ...syncRaw, ...localRaw });
}

export async function ensureDefaults() {
  const [syncCurrent, localCurrent] = await Promise.all([
    chrome.storage.sync.get(SYNC_DEFAULT_PREFERENCES),
    chrome.storage.local.get(LOCAL_DEFAULT_PREFERENCES)
  ]);

  const normalized = normalizePreferences({ ...syncCurrent, ...localCurrent });

  const syncPatch = {
    [STORAGE_KEYS.selectedAI]: normalized[STORAGE_KEYS.selectedAI],
    [STORAGE_KEYS.selectedMode]: normalized[STORAGE_KEYS.selectedMode],
    [STORAGE_KEYS.theme]: normalized[STORAGE_KEYS.theme],
    [STORAGE_KEYS.customChatEnabled]: normalized[STORAGE_KEYS.customChatEnabled]
  };

  const localPatch = {
    [STORAGE_KEYS.customChatUrl]: normalized[STORAGE_KEYS.customChatUrl]
  };

  await Promise.all([chrome.storage.sync.set(syncPatch), chrome.storage.local.set(localPatch)]);
  return normalized;
}

export async function updatePreference(patch) {
  const syncPatch = {};
  const localPatch = {};

  for (const [key, value] of Object.entries(patch)) {
    if (key === STORAGE_KEYS.customChatUrl) {
      localPatch[key] = normalizeChatUrl(value);
    } else {
      syncPatch[key] = value;
    }
  }

  const writes = [];
  if (Object.keys(syncPatch).length > 0) {
    writes.push(chrome.storage.sync.set(syncPatch));
  }

  if (Object.keys(localPatch).length > 0) {
    writes.push(chrome.storage.local.set(localPatch));
  }

  if (writes.length > 0) {
    await Promise.all(writes);
  }
}

export async function getThemeMode() {
  const result = await chrome.storage.sync.get({
    [STORAGE_KEYS.theme]: DEFAULT_PREFERENCES[STORAGE_KEYS.theme]
  });
  return normalizePreferences(result)[STORAGE_KEYS.theme];
}
