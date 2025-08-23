chrome.runtime.onMessage.addListener(function(message, sender, sendReponse) {
    let params = JSON.parse(message);
    console.log(params);
    if (params.action === 'start') {
        console.log('starting monitor')
        chrome.storage.local.set({
            webhook: params.webhook,
            threshold: params.threshold,
            frequency: params.frequency,
            tabId: params.tabId,
            monitoringActive: true
        });
        startQueueMonitor(params.webhook, params.frequency, params.threshold);
        chrome.runtime.sendMessage({ action: "started" });
    } else if (params.action === 'stop') {
        console.log('clearing interval: ' + notifInterval);
        clearInterval(notifInterval);
    }
});

let notifInterval = null;
function startQueueMonitor(webhook, frequency, threshold) {
    function getPosition() {
        const el = document.querySelector(".StatusBox_mainText__9gJXJ strong");
        if (!el) return null;
        const pos = el.innerText;
        return pos;
    }
    function postPosition(webhook, threshold) {
        const pos = getPosition();
        if (pos !== null) {
            console.log(`Queue position: ${pos}`);
            let posInt = pos.replace(',', "");
            posInt = parseInt(posInt);
            if (posInt <= threshold) {
                console.log("send warning");
                // fetch(webhook, {
                //   method: "POST",
                //   headers: { "Content-Type": "application/json" },
                //   body: JSON.stringify({ content: `!!! WARNING: Your queue position is now ${pos}!!!` })
                // });
            } else {
                console.log("send update")
                // fetch(webhook, {
                //   method: "POST",
                //   headers: { "Content-Type": "application/json" },
                //   body: JSON.stringify({ content: `Update: Your queue position is now ${pos}!` })
                // });
            }
        } else {
            console.warn("Queue position element not found.");
        }
    }
    const delay = 60000 * frequency;
    postPosition(webhook, threshold);
    notifInterval = setInterval(postPosition, delay, webhook, threshold);
}