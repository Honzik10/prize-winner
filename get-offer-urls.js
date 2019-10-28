console.log("Injected check-offer-urls.js");
var offerElements = document.getElementsByClassName("thread-title--card");
console.log("offer elements", offerElements)

var offerUrls = [];
while(offerElements.length > 0 && offerUrls.length < 4) {
	var index = Math.ceil(Math.random()*(offerElements.length-1));
	
	var randomHref = offerElements[index].href;
	if(!offerUrls.includes(randomHref) && randomHref) {
		offerUrls.push(randomHref);
	}
}
console.log("Returning urls " + offerUrls);
offerUrls;
