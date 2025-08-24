let tabId = null;
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
        document.getElementById("status").textContent = "Monitoring in progress.";
    }
  });
});

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
        document.getElementById("status").textContent = "Please fill in all fields.";
        return;
    }

    chrome.storage.local.set({ webhook, frequency, userId, threshold }, () => {
        document.getElementById("status").textContent = "Settings saved! Monitoring will start.";
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
    document.getElementById("status").textContent = "Monitoring stopped!";
});