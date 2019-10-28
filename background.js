var pageQuery = {url: "https://www.pepper.pl/*"};
var notificationAudio = new Audio("http://soundbible.com/mp3/Bell%20Sound%20Ring-SoundBible.com-181681426.mp3");
var intervalSleepMs = 1000;
var timeToOpenNewTabs = 70000;
var notifiedTabIds = []; //tmp solution cause notifications are not showing
var tabOpeningDate;
var mascotCheckDate;
var runId = 0;
var previouslyFinishedRunId = -1;
var forceOpenTabs = true;

//setup run to refresh and open tabs - sets interval check
setInterval(() => {
    startScript();
}, 1000);

function startScript() {

    if (forceOpenTabs || (calculatePassedMsForGivenDate(tabOpeningDate) > timeToOpenNewTabs && (runId == previouslyFinishedRunId))) {
        runId++;
        forceOpenTabs = false;
        openNewTabs();
    } else if (mascotCheckDate == null || calculatePassedMsForGivenDate(mascotCheckDate) > intervalSleepMs) {
        checkTabsForMascot();
    }
}

function calculatePassedMsForGivenDate(date) {
    return (new Date() - date);
}

async function checkTabsForMascot() {
    let tabs = await getTabs();
    console.log("Checking if any of %d tabs have mascot", tabs.length);

    for (i in tabs) {
        let isMascotExists = await checkForMascot(tabs[i].id);
        if (isMascotExists) {
            notifyOnMascotFind(tabs[i]);
        }
    }

    mascotCheckDate = new Date();
}

function checkForMascot(tabId) {
    return new Promise(((resolve, reject) => {
        chrome.tabs.executeScript(tabId, {file: "check-for-mascot.js"}, result => rejectOnErrorOrResolveWithValue(resolve, reject, result[0]));
    }));
}

function notifyOnMascotFind(tab) {
    if (notifiedTabIds.includes(tab.id)) {
        return;
    }
    notifiedTabIds.push(tab.id);
    let msg = "Winner winner chicken dinner in tab " + tab.title;
    alert(msg);
    console.log(msg);
    notificationAudio.play();

    chrome.notifications.create('12', {
        message: msg,
        type: "basic",
        title: "Mascot found",
        iconUrl: 'notification.jpg'
    }, function (id) {
        console.log("notification %s created", id);
    });

    chrome.notifications.getPermissionLevel(function (permLevel) {
        console.log(permLevel);
    });
}

async function openNewTabs() {
    notifiedTabIds = [];

    let tabs = await getTabs();
    let mainPageTab = tabs[0];
    let activeTab = await getActiveTabByWindowId(mainPageTab.windowId);
    await setActiveTab(mainPageTab);
    await reloadTab(mainPageTab);
    await waitForReload(mainPageTab);

    let idsOfTabsToClose = tabs.map(x => x.id).slice(1);
    await closeTabs(idsOfTabsToClose);

    let offerUrls = await getOfferUrlsFromMainTab(mainPageTab);
    console.log("Opening new urls %a", offerUrls);
    for (i in offerUrls) {
        await createTab(offerUrls[i], true, mainPageTab.windowId);
    }

    //TODO tab wont switch to active
    await updateTab(activeTab.id, {highlighted: true, active: true, selected: true});
    await setActiveTab(activeTab);
    previouslyFinishedRunId = runId;
    tabOpeningDate = new Date();
}

function getOfferUrlsFromMainTab(mainTab) {
    console.log("getOfferUrlsFromMainTab %d %s", mainTab.id, mainTab.title);
    return new Promise(((resolve, reject) => {
        chrome.tabs.executeScript(mainTab.id, {file: "get-offer-urls.js"}, urls => rejectOnErrorOrResolveWithValue(resolve, reject, urls[0]));
    }));
}

function waitForReload(tab) {
    return new Promise(((resolve, reject) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (info.status === 'complete' && tabId === tab.id) {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve(tab);
            }
        });
    }));
}

function reloadTab(tab) {
    console.log("reload %d %s", tab.id, tab.title);
    return new Promise(((resolve, reject) => {
        try {
            chrome.tabs.reload(tab.id, () => {
                rejectOnErrorOrResolveWithValue(resolve, reject, null)
            });
        } catch (err) {
            reject(err);
        }
    }));
}

function createTab(url, active, windowId) {
    return new Promise(((resolve, reject) => {
        chrome.tabs.create({url: url, active: active, windowId: windowId}, result => rejectOnErrorOrResolveWithValue(resolve, reject, result));
    }));
}

function closeTabs(tabIds) {
    return new Promise(((resolve, reject) => {
        chrome.tabs.remove(tabIds, result => rejectOnErrorOrResolveWithValue(resolve, reject, result));
    }));
}

function getTabs() {
    return new Promise(((resolve, reject) => {
        chrome.tabs.query(pageQuery, tabs => rejectOnErrorOrResolveWithValue(resolve, reject, tabs));
    }));
}

function getAllTabs() {
    return new Promise(((resolve, reject) => {
        chrome.tabs.query({}, tabs => rejectOnErrorOrResolveWithValue(resolve, reject, tabs));
    }));
}

function getActiveTabByWindowId(windowId) {
    return new Promise(((resolve, reject) => {
        chrome.tabs.query({active: true, windowId: windowId}, activeTab => rejectOnErrorOrResolveWithValue(resolve, reject, activeTab[0]));
    }));
}

function setActiveTab(tab) {
    if (!tab) {
        return;
    }
    console.log("setActiveTab %d %s", tab.id, tab.title);
    return new Promise(((resolve, reject) => {
        chrome.tabs.update(tab.id, {selected: true}, result => rejectOnErrorOrResolveWithValue(resolve, reject, result));
    }));
}

function updateTab(tabId, values) {
    return new Promise(((resolve, reject) => {
        chrome.tabs.update(tabId, values, result => rejectOnErrorOrResolveWithValue(resolve, reject, result));
    }));
}

function rejectOnErrorOrResolveWithValue(resolve, reject, value) {
    let lastErr = chrome.runtime.lastError;
    if (lastErr) {
        console.error(lastErr.message);
        reject(lastErr);
    } else {
        resolve(value);
    }
}
