var eventHandler = (function(window, undefined) {
	function init(webview, socket){
		//No events : blur, focus, load, resize, scroll, unload,
		//            beforeunload, change, select, submit,
		webview.bind("click dblclick mousedown mouseup mousemove keydown keypress keyup", function(e){
			bindFunc(e);
		});
		
		$(document).bind(" keydown keypress keyup", function(e) {
			bindFunc(e);
		});
		
	}
	
	function bindFunc(e){
		//if(e.target["nodeName"] != "CANVAS" && e.target["nodeName"] != "BODY" ) {
		if(e.target["nodeName"] != "IMG" && e.target["nodeName"] != "BODY" ) {
			return;
		}
				
		var event = new Object();	
		var rplist = "currentTarget delegateTarget fromElement target toElement view handleObj originalEvent"
		for(var property in e) {
			if( e.hasOwnProperty(property) && typeof e[property] != 'function' && rplist.indexOf(property) == -1) 
				event[property] = e[property];
		}

		socket.emit('uiEvent', event);
	}
	
	return {
		init : init,
		bindFunc : bindFunc,
	}
})(window);

