let monitoredTabId = null;
let originalUrl = null;

chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg.action === "started") {
        console.log('tab: ' + sender.tab.id + ', url: ' + sender.tab.url)
        monitoredTabId = sender.tab.id;
        originalUrl = sender.tab.url;
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    monitoredTabId &&
    tabId === monitoredTabId &&
    changeInfo.url && // URL has changed
    changeInfo.url !== originalUrl
  ) {
    console.log("Navigated away, resetting some storage...");
    chrome.storage.local.set({
        tabId: "",
        monitoringActive: false
    });
    monitoredTabId = null;
    originalUrl = null;
  }
});
