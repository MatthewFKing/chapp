			var socket = io.connect();
			$('#form').submit(function(){
					var input = $('#chat_input').val();
					socket.emit('message', input);
					$('#chat_input').val('');
					return false;
			});

			socket.on('message', function(data) {

					let msg = $('<p>').text(data.msg);
					if (data.socket == socket.id){
						let name = $('<h5>').text('- ' + data.name);
						$('#list').append($('<div>').addClass('list-group-item me').append(name).append(msg));
						$('.text-box').scrollTop($('.text-box')[0].scrollHeight);
					} else {
						let name = $('<h5>').text(data.name + ' -');
						$('#list').append($('<div>').addClass('list-group-item not-me').append(name).append(msg));
						$('.text-box').scrollTop($('.text-box')[0].scrollHeight);
					}
			});

			$('#user-form').submit(function(){
					var input = $('#name-input').val();
					socket.emit('send-name', input);
			});
			socket.on('working', function(msg) {
			//	id = msg;
			});
