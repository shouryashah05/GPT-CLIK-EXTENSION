// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'searchChatGPT',
    title: 'Ask ChatGPT',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'searchChatGPT' && info.selectionText) {
    const query = encodeURIComponent(info.selectionText);
    chrome.tabs.create({ 
      url: `https://chat.openai.com/?q=${query}`
    });
  }
});