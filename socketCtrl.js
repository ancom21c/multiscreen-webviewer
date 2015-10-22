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
			
			socket.emit('mode', socket.id, _sessionManager.getGuideMode());
			socket.emit('confirmed', 'over');
			
		});
		
		socket.on('resizing', function(viewport){
			_sessionManager.resizeOf(socket.id, viewport);
		});
		
		socket.on('uiEvent', function(e) {
			//find sid
			var s = socket.id;
			
			//handle event 
			//PHhandler
			_sessionManager.handle(s, e, "phHandler");
			
		});
		
		socket.on('removeAllGuide', function() {
			_sessionManager.removeAllGuide();
			for( var i in socketRoom) {
				
				socketRoom[i].emit('arrowList', []);
			}
			
		});
		
		socket.on('guideModeOn', function(){
			
			//_sessionManager.removeAllGuide();
			_sessionManager.setGuideMode(1);
			
			
			socket.broadcast.emit('mode', socket.id,1);
			socket.emit('mode', socket.id,1);
			
			console.log("guide mode on");

		});
		
		socket.on('guideModeOff', function() {
			_sessionManager.setGuideMode(0);
			socket.broadcast.emit('mode',socket.id, 0);
			socket.emit('mode', socket.id, 0);

			console.log("guide mode off");
		});
		
		socket.on('outward', function(angle, pos, ori){
			var s = socket.id;
			
			_sessionManager.addGuide(s, angle, 1, pos, ori);
			_sessionManager.setGuideMode(2);
			socket.broadcast.emit('mode', s, 2);
			socket.emit('mode', s, 2);
			var l = _sessionManager.getGuideListOf( s );
			socket.emit('arrowList', l);
			
		});
		
		socket.on('inward', function(angle, pos, ori){
			var s = socket.id;
			
			_sessionManager.addGuide(s, angle, 2, pos, ori);

			_sessionManager.setGuideMode(1);
			
			for( var i in socketRoom) {
				
				socketRoom[i].emit('mode', s, 1);
				var l = _sessionManager.getGuideListOf( socketRoom[i].id );
				if( l.length > 0)
					socketRoom[i].emit('arrowList', l);
			}
			
			
		});
			
		socket.on('sendMessage', function(data){
			console.log('sendMessage!');
			
			if( data.src === ''){
				return;
			}
			
    	});
		
		socket.on('message', function(message) {
            socket.broadcast.emit('message', message);
        });
		
		socket.on('closeOthersBar', function(){
			socket.broadcast.emit('closeBar');
		});
		
		socket.on('disconnect', function(data) {
			console.log('disconnected');
			if (socketRoom[socket.id] !== undefined){
				var key = socketRoom[socket.id];
				
				socket.leave(socketRoom[socket.id]);
				delete socketRoom[socket.id];
				_sessionManager.removeSession(socket.id);
				
			}
			
			if(_sessionManager.getNumSession() == 0) {
				_sessionManager.stopRendering();
				return;
			}
			
			//update guides
			var v = _sessionManager.calculateViewport();
			if( v != 0) {
				for( var i in socketRoom) {
					var l = _sessionManager.getGuideListOf( socketRoom[i].id );
					if( l.length > 0)
						socketRoom[i].emit('arrowList', l);
				}
			} else {
				socket.broadcast.emit('mode', socket.id, v);
			}
			
		});
		socket.on('requestTotalRenderView', function(){
			socket.emit('totalRenderView', _sessionManager.getTotalRenderView());			
		});
		
		socket.on('requestSessionList', function(){

			var sessionList = _sessionManager.getSessionList();
			console.log("session list:");
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
		if(socketRoom[sid] !== undefined)
			socketRoom[sid].emit('renderData', data);
	}

}
