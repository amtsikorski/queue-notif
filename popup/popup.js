let tabId = null;

function setStatus(text, active) {
    const status = document.getElementById("status");
    document.getElementById("statusText").textContent = text;
    status.classList.toggle("visible", !!text);
    status.classList.toggle("active", !!active);
}

document.addEventListener("DOMContentLoaded", () => {
  // Load saved values into inputs when popup opens
  chrome.storage.local.get(
    ["webhook", "frequency", "userId", "threshold", "tabId", "monitoringActive"],
    (data) => {
    console.log(data);
    if (data.webhook) document.getElementById("webhook").value = data.webhook;
    if (data.frequency) document.getElementById("frequency").value = data.frequency;
    if (data.userId) document.getElementById("userId").value = data.userId;
    if (data.threshold) document.getElementById("threshold").value = data.threshold;
    if (data.tabId) tabId = data.tabId;
    if (data.monitoringActive === true) {
        document.getElementById("start").style.display = "none";
        document.getElementById("stop").style.display = "";
        setStatus("Monitoring in progress", true);
    }
  });
});

const COLLAPSED_HEIGHT = 276;
const EXPANDED_HEIGHT = 400;

function resizePopupToContent() {
    // The action popup is its own browser window, and Chrome only auto-grows
    // it as content is added; it won't shrink the window back down on its own,
    // so ask the window directly to match the new content height.
    const accordion = document.querySelector(".accordion");
    const height = accordion.open ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
    document.documentElement.style.height = `${height}px`;
}

document.querySelector(".accordion").addEventListener("toggle", resizePopupToContent);
resizePopupToContent();

document.querySelectorAll(".tooltip").forEach(el => {
  el.addEventListener("click", () => {
    const section = el.getAttribute("data-help");
    chrome.tabs.create({
      url: chrome.runtime.getURL("help.html") + "#" + section
    });
  });
});

document.getElementById("start").addEventListener("click", () => {
    const webhook = document.getElementById("webhook").value.trim();
    const frequency = parseInt(document.getElementById("frequency").value.trim(), 10);
    const userId = document.getElementById("userId").value.trim();
    const threshold = parseInt(document.getElementById("threshold").value.trim(), 10);

    if (!webhook || !userId || isNaN(frequency) || isNaN(threshold)) {
        setStatus("Please fill in all fields", false);
        return;
    }

    chrome.storage.local.set({ webhook, frequency, userId, threshold }, () => {
        setStatus("Settings saved, monitoring will start", true);
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;
        console.log('tabId: ' + tabId)
        const params = {
            action: 'start',
            webhook: webhook,
            frequency: frequency,
            userId: userId,
            threshold: threshold,
            tabId: tabId
        };
        chrome.scripting.executeScript({
            target: {tabId: tabId},
            files: [ "content.js" ]
        })
        .then(() => chrome.tabs.sendMessage(tabId, JSON.stringify(params)));
    });
    document.getElementById("start").style.display = "none";
    document.getElementById("stop").style.display = "";
});

document.getElementById("stop").addEventListener("click", () => {
    const params = {
        action: 'stop'
    };
    console.log('tabId: ' + tabId);
    chrome.tabs.sendMessage(tabId, JSON.stringify(params));
    chrome.storage.local.set({
        tabId: "",
        monitoringActive: false
    });
    document.getElementById("start").style.display = "";
    document.getElementById("stop").style.display = "none";
    setStatus("Monitoring stopped", false);
});