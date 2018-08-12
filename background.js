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
		console.log("executing script for " + tabs.length);
		for(var i=0;i<tabs.length;i++) {
			chrome.tabs.executeScript(tabs[i].id, {file: "check-for-mascot.js"}, function(arr){
				if(arr[0] === true) {
					new Audio(notificationAudioUrl).play();
				}
			});
		}
	});
}

function closeTabsAndOpenNew() {
	chrome.tabs.query(pageQuery, function(tabs) {
		console.log("closing of %d tabs", tabs.length);
		chrome.tabs.remove(tabs.map(x => x.id).slice(1), function() {
			openNewTabs();
		});
	});
}

function openNewTabs() {
	chrome.tabs.query(pageQuery, function(tabs) {
		chrome.tabs.executeScript(tabs[0].id, {file: "get-offer-urls.js"}, function(data){
			var urls = data[0];
			console.log("Opening new tabs " + urls.length);
			urls.forEach(function(url) {
				chrome.tabs.create({url: url});
			});
		});
	});
}

var intervalSleepMs = 5000;
var startDate = new Date();
var intervalCounter = 0;
var reloadTimeMs = 61000;
var timeToOneNewTabs = 60000 * 30;

setInterval(function() {
  console.log("5 secs interval script...");
  intervalCounter++;
  
  if(intervalCounter*intervalSleepMs > timeToOneNewTabs) {
	closeTabsAndOpenNew();
  }
  
  checkForMascot();
  if(new Date().getTime() - startDate.getTime() > reloadTimeMs) {
	  startDate = new Date();
	  reloadTabs();
  }
}, intervalSleepMs);