$(document).ready(function () {
	$('body').append('<div class="alert-container"><div class="alert-message"></div><div class="close-container-btn">X</div> </div>');

	var timer = null;
	var soundFile = null;

	var clear = function () {
		$('body').removeClass('alert-state');
		$('.alert-container').removeClass('show')
		$('.alert-container .alert-message').html('');
		if (soundFile) {
			soundFile.pause()
			soundFile = null;
		}
	};

	window.socket.on('alert', function (data) {
		var type = data.type;
		var message = data.message;
		var bg_color = data.bg_color || '#2b2e2b';
		var timeout = data.timeout || 15000;

		if (typeof data.sound !== "undefined" && data.sound && data.sound.length > 1) {
			soundFile = new Pizzicato.Sound(data.sound, function () {
				soundFile.play();
			});
		}

		$('.alert-container').css('background-color', bg_color);

		if (timer) clearTimeout(timer);
		clear();


		timer = setTimeout(function () {
			clear();
		}, timeout);

		if (type === 'alert' && typeof message !== "undefined" && message.length > 0) {
			$('body').addClass('alert-state');
			$('.alert-container').addClass('show');
			$('.alert-container .alert-message').html(message);
		}

	});

	$('.alert-container').on('click', function () {
		clear();
	})

});
