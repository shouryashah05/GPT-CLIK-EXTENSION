import { AI_PROVIDERS } from "./constants.js";

export function getAiTarget(provider) {
  switch (provider) {
    case AI_PROVIDERS.claude:
      return { url: "https://claude.ai/new", host: "claude.ai" };
    case AI_PROVIDERS.gemini:
      return { url: "https://gemini.google.com/app", host: "gemini.google.com" };
    case AI_PROVIDERS.chatgpt:
    default:
      return { url: "https://chatgpt.com/", host: "chatgpt.com" };
  }
}

export function contextMenuItemToProvider(menuItemId) {
  if (menuItemId === "clikgpt_ai_chatgpt") {
    return AI_PROVIDERS.chatgpt;
  }

  if (menuItemId === "clikgpt_ai_claude") {
    return AI_PROVIDERS.claude;
  }

  if (menuItemId === "clikgpt_ai_gemini") {
    return AI_PROVIDERS.gemini;
  }

  return null;
}
