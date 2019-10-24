var pageQuery = {url: "https://www.pepper.pl/*"};
var notificationAudioUrl = "http://soundbible.com/mp3/Bell%20Sound%20Ring-SoundBible.com-181681426.mp3";

function reloadTabs() {
	chrome.tabs.query(pageQuery, function(tabs) {
		console.log("reloading tabs " + tabs.length);

		for(var i=1;i<tabs.length;i++) {
			chrome.tabs.reload(tabs[i].id);
		}
	});
}

function checkForMascot() {
	chrome.tabs.query(pageQuery, function(tabs) {
		console.log("executing script for %d tabs", tabs.length);
		for(var i=0;i<tabs.length;i++) {
			chrome.tabs.executeScript(tabs[i].id, {file: "check-for-mascot.js"}, function(arr){
				if(arr[0] === true) {
                    console.error("Winner winner chicken dinner");
                    new Audio(notificationAudioUrl).play();
                    alert("Winner winner chicken dinner");
				}
			});
		}
	});
}

function closeTabsAndOpenNew() {
	chrome.tabs.query(pageQuery, function(tabs) {
		console.log("closing of %d tabs", tabs.length);
		chrome.tabs.remove(tabs.map(x => x.id).slice(1), function() {
			openNewTabs(tabs[0]);
		});
	});
}

function openNewTabs(firstTab) {
    chrome.tabs.reload(firstTab.id, null, function () {
        chrome.tabs.executeScript(firstTab.id, {file: "get-offer-urls.js"}, function (data) {

            function currentTabCallback(tabs) {
                var urls = data[0];
                var currTab = tabs[0];
                if (!currTab) {
                    return;
                }
                console.log("Opening new %d tabs", urls.length);
                urls.forEach(function (url) {
                    chrome.tabs.create({url: url, active: true},createNewTabCallback);
                });

                function createNewTabCallback() {
                    chrome.tabs.update(currTab.id, {selected: true});
                }
            }

            chrome.tabs.query({active: true, currentWindow: true}, currentTabCallback);
        });
    });
}

var intervalSleepMs = 1000;
var startDate = new Date();
var intervalCounter = 0;
var reloadTimeMs = 65000;
var timeToOpenNewTabs = 60000 * 1;

setInterval(function() {
  console.log("run of interval check script");

  if(intervalCounter*intervalSleepMs > timeToOpenNewTabs || intervalCounter===0) {
	closeTabsAndOpenNew();
	intervalCounter = 1;
  } else {
  	intervalCounter++;
  }

  checkForMascot();
  if(new Date().getTime() - startDate.getTime() > reloadTimeMs) {
	  startDate = new Date();
	  reloadTabs();
  }
}, intervalSleepMs);
