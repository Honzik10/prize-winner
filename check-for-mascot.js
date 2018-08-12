console.log("Injected check-for-mascot.js");
var x = document.getElementsByClassName("mc-notification-inner");
var result = false;;
if(x.length > 0) {
	//new Audio("http://soundbible.com/mp3/Bell%20Sound%20Ring-SoundBible.com-181681426.mp3").play();
	console.log("Winner winner chicken dinner");
	alert("Winner winner chicken dinner");
	result = true;
}
result;

