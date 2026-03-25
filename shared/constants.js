export const STORAGE_KEYS = {
  selectedAI: "selectedAI",
  selectedMode: "selectedMode",
  theme: "theme",
  customChatEnabled: "customChatEnabled",
  customChatUrl: "customChatUrl"
};

export const AI_PROVIDERS = {
  chatgpt: "chatgpt",
  claude: "claude",
  gemini: "gemini"
};

export const INTERACTION_MODES = {
  instant: "instant",
  pasteEdit: "paste_edit",
  showMenu: "show_menu"
};

export const THEME_MODES = {
  light: "light",
  dark: "dark"
};

export const DEFAULT_PREFERENCES = {
  [STORAGE_KEYS.selectedAI]: AI_PROVIDERS.chatgpt,
  [STORAGE_KEYS.selectedMode]: INTERACTION_MODES.instant,
  [STORAGE_KEYS.theme]: THEME_MODES.light,
  [STORAGE_KEYS.customChatEnabled]: false,
  [STORAGE_KEYS.customChatUrl]: ""
};

export const AI_LABELS = {
  [AI_PROVIDERS.chatgpt]: "ChatGPT",
  [AI_PROVIDERS.claude]: "Claude",
  [AI_PROVIDERS.gemini]: "Gemini"
};

export const MODE_LABELS = {
  [INTERACTION_MODES.instant]: "Instant Ask",
  [INTERACTION_MODES.pasteEdit]: "Paste & Edit",
  [INTERACTION_MODES.showMenu]: "Show Menu"
};

export const SUPPORTED_CHAT_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "claude.ai",
  "gemini.google.com"
];

export const RESTRICTED_SOURCE_HOST_KEYWORDS = [
  "accounts.",
  "bank",
  "billing",
  "checkout",
  "login",
  "signin",
  "auth",
  "admin",
  "webmail",
  "mail."
];
