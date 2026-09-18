chrome.runtime.onMessage.addListener(function(message, sender, sendReponse) {
    let params = JSON.parse(message);
    console.log(params);
    if (params.action === 'start') {
        console.log('starting monitor')
        chrome.storage.local.set({
            tabId: params.tabId,
            monitoringActive: true
        });
        startQueueMonitor(params.webhook, params.frequency, params.userId, params.threshold);
        chrome.runtime.sendMessage({ action: "started" });
    } else if (params.action === 'stop') {
        console.log('clearing interval: ' + notifInterval);
        clearInterval(notifInterval);
    }
});

let notifInterval = null;
let checkCount = 0;
let checksPerReport = 0;
function getPosition() {
    const el = document.querySelector(".StatusBox_mainText__9gJXJ strong");
    if (!el) {
        console.warn("Queue position element not found.");
        return 0;
    }
    const pos = el.innerText;
    console.log(`Queue position: ${pos}`);
    return pos;
}

function postPosition(webhook, content) {
    fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content })
    });
}

function checkPosition(webhook, userId, threshold) {
    const pos = getPosition();
    let posInt = pos.replace(',', "");
    posInt = parseInt(posInt);
    checkCount++;
    console.log('pos: ' + posInt + ', checksCount: ' + checkCount)
    if (posInt <= threshold) {
        console.log("send mention update");
        let warningMessage = `Warning <@${userId}>: Your queue position is now ${pos} !!!`;
        postPosition(webhook, warningMessage);
        return;
    }

    if (checkCount >= checksPerReport) {
        console.log("send update")
        let updateMessage = `Update: Your queue position is now ${pos}!`;
        postPosition(webhook, updateMessage);
        checkCount = 0;
    }
}

function startQueueMonitor(webhook, frequency, userId, threshold) {
    const checkInterval = 60000; //every minute
    checksPerReport = (frequency * 60 * 1000) / checkInterval;
    const initPos = getPosition();
    const initialUpdate = `Start: Your queue position is ${initPos}!`
    postPosition(webhook, initialUpdate);
    notifInterval = setInterval(checkPosition, checkInterval, webhook, userId, threshold);
}