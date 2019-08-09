$(document).ready(function () {
	$('body').append('<div class="alert-container"><div class="alert-message"></div><div class="close-container-btn">X</div> </div>');

	var audioElement = document.createElement('audio');
	audioElement.setAttribute('src', '/sounds/alert2.mp3');


	var timer = null;

	var clear = function () {
		$('body').removeClass('alert-state');
		$('.alert-container').removeClass('show')
		$('.alert-container .alert-message').html('');
		audioElement.pause();
		audioElement.currentTime = 0;
	};

	window.socket.on('alert', function (data) {
		var type = data.type;
		var message = data.message;


		if (timer) clearTimeout(timer);
		clear();


		timer = setTimeout(function () {
			clear();
		}, 25000);

		if (type === 'alert') {
			audioElement.play();
			$('body').addClass('alert-state');
			$('.alert-container').addClass('show');
			$('.alert-container .alert-message').html(message);
		}

	});

	$('.close-container-btn').on('click', function () {
		clear();
	})
});
