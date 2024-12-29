// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'searchChatGPT',
    title: 'Ask ChatGPT',
    contexts: ['selection']
  });

  // Check the state of the checkbox and create the context menu if enabled
  chrome.storage.sync.get(['dropdownEnabled'], (data) => {
    if (data.dropdownEnabled) {
      chrome.contextMenus.create({
        id: 'injectChatGPTBox',
        title: 'Inject text in ChatGPT Box',
        contexts: ['selection']
      });
    }
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'searchChatGPT' && info.selectionText) {
    const query = encodeURIComponent(info.selectionText);
    chrome.tabs.create({ url: `https://chat.openai.com/?q=${query}` });
  }

  if (info.menuItemId === 'injectChatGPTBox' && info.selectionText) {
    const query = info.selectionText;
    chrome.tabs.create({ url: 'https://chat.openai.com/' }, (newTab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === newTab.id && changeInfo.status === 'complete') {
          chrome.scripting.executeScript({
            target: { tabId: newTab.id },
            func: (text) => {
              const textbox = document.querySelector('textarea');
              if (textbox) {
                textbox.value = text;
                textbox.dispatchEvent(new Event('input', { bubbles: true }));
              }
            },
            args: [query],
          });
          chrome.tabs.onUpdated.removeListener(listener);
        }
      });
    });
  }
});

// Listen for changes in the checkbox state and update the context menu
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.dropdownEnabled) {
    if (changes.dropdownEnabled.newValue) {
      chrome.contextMenus.create({
        id: 'injectChatGPTBox',
        title: 'Inject text in ChatGPT Box',
        contexts: ['selection']
      });
    } else {
      chrome.contextMenus.remove('injectChatGPTBox');
    }
  }
});