			var socket = io.connect();
			$('#form').submit(function(){
					var input = $('#chat_input').val();
					socket.emit('message', input);
					$('#chat_input').val('');
					
			});
			
			$('.delete-button').click(function(e){
				console.log(e.target.name);
				$.ajax({
                    type: 'DELETE',
                    url: '/post/' + e.target.name,
                    success: function(){
                    	window.location.assign('/');
                    }
                });
			});
			
			$('#btn-login').click(function(e){
				window.location.assign('/login');
			});
			
			$('#btn-logout').click(function(e){
				window.location.assign('/logout');
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
			
			
