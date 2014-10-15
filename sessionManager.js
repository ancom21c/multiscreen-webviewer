//session list
var sessionList;
var numSession;
var _webdriver;
var totalRenderView;
var sessionIndex;
var lastSession;
var Canvas = require("canvas"),
	Image = Canvas.Image;

module.exports = {
	init : function(webdriver) {
		console.log("Session Manager Initiated");
		sessionList = {};
		numSession = 0;
		_webdriver = webdriver;
		sessionIndex = 0;
		lastSession = {};
	},
	addSession : function(s, info) {
		//info : 
		//- deviceName
		//- microphone
		//- input- touch/mouse/keyboard
		//- clientResolution(width, height)
		//- clientViewport
		var newSession = {
			id: s,
			index: sessionIndex++,
			clientViewport: {},	
			clientResolution : info.clientResolution,
				
		};
		
		//sessionList.push( newSession );
		sessionList[s] = newSession;
		numSession++;
		lastSession = newSession;
		module.exports.autoAlign();
	},
	
	removeSession : function(s) {
		delete sessionList[s];
		numSession--;
		module.exports.autoAlign();
	},
	
	alignSessionInfo : function() {
		for( var s in sessionList) {
			var session = sessionList[s];
			
			session.clientViewport = { 
					//prototype
					vx: 0,
					vy: 0,
					width: session.clientResolution.width, 
					height: session.clientResolution.height};
			
		}
	},
	

	autoAlign : function() {
		//Needed Info - orientation : horizontal/landscape
		
		//TODO : page scroll control
		
		
		//create composite viewport
		var ps = lastSession;
		
		ps.clientViewport = {
				vx: 0,
				vy: 0,
				width : 0,
				height : 0
		};
		var comView = {
				vx: 0,
				vy: 0,
				width : 0,
				height : 0
		};
		
		//ver 0.1 : asssumtion - all screens have same size, same orientation
		//mode - odd/even
		
		//for odd - parallel alignment
		// page - landscape, screens - landscape >> horizontal align  02 = 1
		// page - landscape, screens - horizontal >> landscape align  03 = 0
		// page - horizontal, screens - landscape >> horizontal align 12 = 1
		// page - horizontal, screens - horizontal >> landscape align 13 = 0 
		var pOrientationBit;
		var viewport = _webdriver.getViewport();
		if( viewport.width > viewport.height) {
			pOrientationBit = 1; // landscape
		} else
			pOrientationBit = 0;
		var sOrientationBit;
		if( lastSession.clientResolution.width > lastSession.clientResolution.height) {
			sOrientationBit = 1; // landscape
		} else
			sOrientationBit = 0;
	
		
		if( numSession%2 == 0) {
			//for even
			var c = 1;
			for( var s in sessionList) {
				var session = sessionList[s];
				
				
				if( numSession/2 > c) 
					//landscape
					comView.width += session.clientResolution.width;
				else
					//horizontal
					comView.height += session.clientResolution.height;
				
				c++;
			}
		} else {
			//for odd
			/*
			if( sOrientationBit == 0 ) {
				//landscape alignment
				comView.width = session.clientResolution.width * numSession;
				comView.height = session.clientResolution.height;
			}
			else {
				//horizontal
				comView.width = session.clientResolution.width;
				comView.height = session.clientResolution.height * numSession;
			}
			*/
			
			var c = 1;
			
			for( var s in sessionList) {
				var session = sessionList[s];
				
				if( sOrientationBit == 0 ) {
					//landscape alignment
					session.clientViewport = { 
							//prototype
							vx: (ps.clientViewport.vx + ps.clientViewport.width),
							vy: (ps.clientViewport.vy),
							width: viewport.width / numSession , 
							height: viewport.height,
					};
					
					
					//comView.width += session.width;
				}
				else {
					//horizontal
					session.clientViewport = { 
							//prototype 
							vx: (ps.clientViewport.vx),
							vy: (ps.clientViewport.vy + ps.clientViewport.height),
							width: viewport.width  , 
							height: viewport.height / numSession,
					};
					
					
					//comView.height += session.height;
				}
				
				ps = session;
			}
		}
			

		if( numSession%2 == 0) {
			//for even
			var c = 1;
			for( var s in sessionList) {
				var session = sessionList[s];
		
				if( numSession/2 > c ) {
					//landscape
					ps.clientViewport = { 
							//prototype
							vx: 0,
							vy: viewport.height / 2 ,
							width: 0 , 
							height:(numSession > 2? viewport.height / 2 : viewport.height),
					};
					
					
					c = 0;
					
				} 
				session.clientViewport = { 
						//prototype
						//landscape 
						vx: (ps.clientViewport.vx + ps.clientViewport.width),
						vy: (ps.clientViewport.vy),
						width: viewport.width / (numSession > 2 ? numSession/2 : 2) , 
						height: (numSession>2 ? viewport.height / 2 : viewport.height),
				};
				
				c++;
				ps = session;
			}
		} 
		/*
		else {
			for( var s in sessionList) {
				var session = sessionList[s];
				
				if( sOrientationBit == 0 ) {
					//landscape alignment
					comView.width += session.width;
					
				}
				else {
					//horizontal
					comView.height += session.height;
				}
			}
		}
		*/
		/*
		for( var s in sessionList) {
			var session = sessionList[s];
			
			//landscape
			session.clientViewport = { 
					//prototype
					vx: 0,
					vy: 0,
					width: session.clientResolution.width, 
					height: session.clientResolution.height};
			
			ps = session;
			
		}
		*/
	},
	
	setAlignSession : function( s, session ) {
		//prototype
		sessionList[s] = session;
		
	},
	
	getSession : function(sid) {
		return sessionList[sid];
	},
	
	getSessionList : function() {
		return sessionList;
	},
	

	indexOf: function(sid) {
		return sessionList.indexOf(sid);
	},
	
	manageRender: function(img) {
		totalRenderView = img;
		var viewport = _webdriver.getViewport();	
		var image = new Image();
		
		
		for(var s in sessionList) {
			//console.log("let's get the show in the road");
			var session = sessionList[s];
			
		
			var segCanvas = new Canvas(viewport.width,viewport.height);
			var segCtx = segCanvas.getContext('2d');
			
			/*
			image.onload = function() {
				segCtx.drawImage(image, session.clientViewport.vx, session.clientViewport.vy, session.clientViewport.width, session.clientViewport.height,
						0,0, session.clientResolution.width, session.clientResolution.height);	
				
				var segmentImg = img;
				console.error(session);
				
				segmentImg["image"] = segCanvas.toDataURL();
				segmentImg["index"] = session.index;
				segmentImg["id"] = session.id;
				segmentImg["viewport"] = session.clientViewport;
				segmentImg["pageViewport"] = viewport; 
				
				_webdriver.manageRender(s, segmentImg);
			};
			image.onerror = function(err) {
				console.error(err);
				console.error(session);
			}

			image.src = new Buffer(img.image, 'base64');
			*/
			
			
			
			// Let clients deal this img... damn node-canvas
			var segmentImg = img;
			
			segmentImg["index"] = session.index;
			segmentImg["id"] = session.id;
			segmentImg["viewport"] = session.clientViewport;
			segmentImg["pageViewport"] = _webdriver.getViewport(); 
			
			_webdriver.manageRender(s, segmentImg);
			
		}
	},
	
	getTotalRenderView : function() {
		return totalRenderView;
	},
	
	setViewport : function(viewport) {
		_webdriver.setViewport(parseInt(viewport.width), parseInt(viewport.height));
	},
	
	setSessionViewport : function(s, viewport) {
		if(s !== undefined && viewport !== undefined)
			sessionList[s].clientViewport = viewport;
	},
	
	//binded Ph
	handle : function(sid, e, handler) {
		//find session
		var s = module.exports.getSession(sid);
		var event = e;
		
		//scaling for the session
		// sx, sy : session viewport startpoint
		// offsetx, offsety : event.clientx, clienty
		// vw, vh : client viewport's width, height
		// cw, ch : canvas W, H
		
		// scaledPointX = sx + offsetx * vw / cw
		
		if( s !== undefined){
		
			event.pageX = s.clientViewport.vx + event.clientX * s.clientViewport.width / s.clientResolution.width ; 
			event.pageY = s.clientViewport.vy + event.clientY * s.clientViewport.height / s.clientResolution.height ; 
		}
		/*
		if(handler == "phHandler")
			module.exports.phHandler(event);
		*/
		if( module.exports[handler] !== undefined) 
			module.exports[handler](event);
	},
	
	
	phHandler : function( event){
		
		
		
		//handle Event
		//mouse events:
		//click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave
		if(event.type.indexOf("click") != -1){
			if(event.which == 1)
				event["button"] = 'left';
			else if(event.which == 2)
				event["button"] = 'middle';
			else if(event.which == 3)
				event["button"] = 'right';
			else event["button"] = 'left';
				//error!!!
				
			if(event.type == 'dblclick') 
				event.type = 'doubleclick';
		
		}	
			
		//keyboard events:
		//keydown keypress keyup
		//modifier;
		//0x02000000: A Shift key on the keyboard is pressed
		//0x04000000: A Ctrl key on the keyboard is pressed
		//0x08000000: An Alt key on the keyboard is pressed
		//0x10000000: A Meta key on the keyboard is pressed
		//0x20000000: A keypad button is pressed
		if(event.type.indexOf("key") != -1) {
			
			var modifier = 0;
			if(event.shiftKey)
				modifier = modifier | 0x02000000;
			if(event.ctrlKey)
				modifier = modifier | 0x04000000;
			if(event.altKey)
				modifier = modifier | 0x08000000;
			if(event.metaKey)
				modifier = modifier | 0x10000000;

			event["modifier"] = modifier;
		}
	
		_webdriver.sendEvent(event);
	
		return event;
	}

	
		
}