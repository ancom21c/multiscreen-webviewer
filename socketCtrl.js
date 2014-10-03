var io;
var _sessionManager;
var socketRoom = {};

module.exports = {
	index : function(sio, s) {
		io = sio;
	
		_sessionManager = s;
	},
	connect : function (socket) {
		
		function currentTime(startAt) {
			return (new Date()).getTime() - startAt;
		}
		
		socket.emit('connected');
		
		socket.on('hello', function(roomId, data){
			var s = data;
			if( data == undefined) {
				s = null;
			}
			socket.join(roomId);
			socketRoom[socket.id] = socket;
			//Session Add
			_sessionManager.addSession(socket.id,data);
			
			socket.emit('confirmed', 'over');
		});
		
		socket.on('uiEvent', function(e) {
			//find sid
			var s = socket.id;
			
			//handle event 
			//PHhandler
			_sessionManager.handle(s, e, "phHandler");
			
		});
			
		socket.on('sendMessage', function(data){
			console.log('sendMessage!');
			
			if( data.src === ''){
				return;
			}
			
    	});
		socket.on('disconnect', function(data) {
			console.log('disconnected');
			if (socketRoom[socket.id] !== undefined){
				var key = socketRoom[socket.id];
				
				socket.leave(socketRoom[socket.id]);
				delete socketRoom[socket.id];
				//delete lectures[key].attendee
				
				_sessionManager.removeSession(socket.id);
				
				//io.sockets.in(key.lectureId).emit('disconnect', key.userId);
			}
			/*
			var clients = io.sockets.clients(key);
			for (var i = 0; i < clients.length; i++){
				clients[i].leave(key);
        	}
        	*/
		});
		socket.on('requestTotalRenderView', function(){
			socket.emit('totalRenderView', _sessionManager.getTotalRenderView());			
		});
		
		socket.on('requestSessionList', function(){
			var sessionList = _sessionManager.getSessionList();
			console.log(sessionList);
			socket.emit('sessionList', sessionList);
			
		});
		
		socket.on('setViewport', function(viewport){
			_sessionManager.setViewport(viewport);
		});
		
		socket.on('setSessionViewport', function(s, viewport){
			_sessionManager.setSessionViewport(s, viewport);
		})
		
	},
	manageRender : function(sid, data) {
		//prototype
		//io.sockets.emit('renderData', data);
		
		//send data for each session
		socketRoom[sid].emit('renderData', data);
	}

}
