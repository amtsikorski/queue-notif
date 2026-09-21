let monitoredTabId = null;
let originalUrl = null;

function resetMonitoringState() {
    chrome.storage.local.set({
        tabId: "",
        monitoringActive: false
    });
    chrome.runtime.sendMessage({ action: "stopped" });
    monitoredTabId = null;
    originalUrl = null;
}

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
    resetMonitoringState();
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (monitoredTabId && tabId === monitoredTabId) {
    console.log("Monitored tab closed, resetting some storage...");
    resetMonitoringState();
  }
});
