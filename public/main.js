var states = {
	LOCKED: 1,
	UNLOCKED: 2
};

var currentState = states.LOCKED;
var button = "#unlock-button";
var timer = ".timer";

function unlock() {
	$.ajax({
		url: '/unlock',
		method: 'GET'
	})
		.done(function(success) {
			unlockedHandler();
		})
		.fail(function(error) {
			console.log("Error.");
		})
	;
}

function unlockedHandler() {
	currentState = states.UNLOCKED;
	$(button).attr("disabled", "disabled");
	$(button + " .fa").removeClass("fa-lock").addClass("fa-unlock");
	$(timer).addClass('begin').addClass('end');
	$('h1').text("Door is open!");
	setTimeout(lockedHandler, 10000);
}

function lockedHandler() {
	currentState = states.LOCKED;
	$(button).removeAttr("disabled");
	$(button + " .fa").removeClass("fa-unlock").addClass("fa-lock");
	$(timer).removeClass('begin').removeClass('end').addClass('no-transition');
	$('h1').text("Press to unlock.");
	setTimeout(function() {
		$(timer).removeClass('no-transition');
	}, 100);
}