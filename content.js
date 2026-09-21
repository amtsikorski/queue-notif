if (!window.__queueMonitorInjected) {
window.__queueMonitorInjected = true;

chrome.runtime.onMessage.addListener(function(message, sender, sendReponse) {
    let params = JSON.parse(message);
    console.log(params);
    if (params.action === 'start') {
        console.log('attempting to start monitor')
        try {
            startQueueMonitor(params.webhook, params.frequency, params.userId, params.threshold, params.estimateTime);
            chrome.storage.local.set({
                tabId: params.tabId,
                monitoringActive: true
            });
            chrome.runtime.sendMessage({ action: "started" });
        } catch (e) {
            console.error(e);
            chrome.runtime.sendMessage({ action: "error", message: "Queue position element not found. Is your open tab on Interpark?" });
        }
    } else if (params.action === 'stop') {
        console.log('clearing interval: ' + notifInterval);
        clearInterval(notifInterval);
        clearInterval(fastSampleInterval);
    }
});

let notifInterval = null;
let fastSampleInterval = null;
let checkCount = 0;
let checksPerReport = 0;
let positionHistory = [];
const HISTORY_SIZE = 10;
const MIN_VALID_DELTAS = 3;
const FAST_SAMPLE_INTERVAL = 10000; // every 10 seconds
const FAST_SAMPLE_DURATION = 30000; // for the first 30 seconds only

function recordPosition(posInt) {
    positionHistory.push({ pos: posInt, time: Date.now() });
    if (positionHistory.length > HISTORY_SIZE) {
        positionHistory.shift();
    }
}

// Runs alongside the main once-a-minute interval, but only right after
// start: sampling every 10s for the first 30s gets a few extra data points
// into positionHistory quickly, so an estimate is usually ready by the time
// the first real report/warning would go out
function startFastSampling() {
    const fastSamplingStarted = Date.now();
    fastSampleInterval = setInterval(() => {
        if (Date.now() - fastSamplingStarted >= FAST_SAMPLE_DURATION) {
            clearInterval(fastSampleInterval);
            return;
        }
        try {
            const pos = getPosition();
            recordPosition(parseInt(pos.replace(',', ""), 10));
        } catch (e) {
            console.error(e);
        }
    }, FAST_SAMPLE_INTERVAL);
}

function median(nums) {
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatMinutes(minutes) {
    const rounded = Math.round(minutes);
    if (rounded < 60) {
        return `~${rounded} minute${rounded === 1 ? '' : 's'}`;
    }
    const hours = Math.floor(rounded / 60);
    const mins = rounded % 60;
    return `~${hours}h ${mins}m`;
}

// Estimates time left from the last HISTORY_SIZE samples. Each valid delta is
// normalized to a per-minute rate (deltaPos / deltaMinutes) since samples
// aren't always evenly spaced. Using the median instead of the mean
function getTimeLeftMessage(posInt) {
    const rates = [];
    for (let i = 1; i < positionHistory.length; i++) {
        const prev = positionHistory[i - 1];
        const curr = positionHistory[i];
        const deltaPos = prev.pos - curr.pos;
        const deltaMinutes = (curr.time - prev.time) / 60000;
        if (deltaPos > 0 && deltaMinutes > 0) {
            rates.push(deltaPos / deltaMinutes);
        }
    }
    if (rates.length < MIN_VALID_DELTAS) {
        return "-# Still calculating time left estimation...";
    }
    const ratePerMinute = median(rates);
    const minutesRemaining = posInt / ratePerMinute;
    return `Estimated time left: ${formatMinutes(minutesRemaining)}`;
}

function getPosition() {
    const el = document.querySelector(".StatusBox_mainText__9gJXJ strong");
    if (!el) {
        throw new Error("Queue position element not found.");
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

function checkPosition(webhook, userId, threshold, estimateTime) {
    const pos = getPosition();
    let posInt = pos.replace(',', "");
    posInt = parseInt(posInt);
    recordPosition(posInt);
    checkCount++;
    console.log('pos: ' + posInt + ', checksCount: ' + checkCount)
    if (posInt <= threshold) {
        console.log("send mention update");
        let warningMessage = `Warning <@${userId}> \nQueue position: ${pos}`;
        if (estimateTime) {
            warningMessage += `\n${getTimeLeftMessage(posInt)}`;
        }
        postPosition(webhook, warningMessage);
        return;
    }

    if (checkCount >= checksPerReport) {
        console.log("send update")
        let updateMessage = `Queue position: ${pos}`;
        if (estimateTime) {
            updateMessage += `\n${getTimeLeftMessage(posInt)}`;
        }
        postPosition(webhook, updateMessage);
        checkCount = 0;
    }
}

function startQueueMonitor(webhook, frequency, userId, threshold, estimateTime) {
    const checkInterval = 60000; //every minute
    checksPerReport = (frequency * 60 * 1000) / checkInterval;
    positionHistory = [];
    const initPos = getPosition();
    recordPosition(parseInt(initPos.replace(',', "")));
    let initialUpdate = `---New monitor started--- \nQueue position: ${initPos}`;
    if (estimateTime) {
        initialUpdate += `\n-# Starting time left estimation calculation...`;
        startFastSampling();
    }
    postPosition(webhook, initialUpdate);
    notifInterval = setInterval(checkPosition, checkInterval, webhook, userId, threshold, estimateTime);
}

}
