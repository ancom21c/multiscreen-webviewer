var _ = require('underscore');

//session list
var sessionList;
var canvasList;
var numSession;
var _webdriver;
var totalRenderView;
var sessionIndex;
var lastSession;
var Canvas = require("canvas"),
	Image = Canvas.Image;
var	totalViewCanvas;


var guideList;
var guideIndex;
var guideMode; // 0 : init, 1 : Guide(out), 2 : Guide(in)
var guidePoints;
var guidedViewports;

module.exports = {
	init : function(webdriver) {
		console.log("Session Manager Initiated");
		sessionList = {};
		canvasList = {};
		numSession = 0;
		_webdriver = webdriver;
		sessionIndex = 0;
		lastSession = {};
		
		guideList = [];
		guidePoints = {};
		guideIndex = 0;
		guideMode = 0;
		guidedViewports = {};
		
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
			devicePixelRatio : info.devicePixelRatio
		};
		
		//sessionList.push( newSession );
		sessionList[s] = newSession;
		canvasList[s] = new Canvas(info.clientResolution.width, info.clientResolution.height);
		numSession++;
		lastSession = newSession;
		module.exports.autoAlign();
	},
	
	removeSession : function(s) {
		delete sessionList[s];
		
		//TODO : delete related guidelines
		
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
					height: session.clientResolution.height,

					px : 0,
					py : 0,
					widthPixel: session.clientResolution.width, 
					heightPixel: session.clientResolution.height};
			
		}
	},
	

	autoAlign : function() {
		//Needed Info - orientation : horizontal/landscape
		
		//TODO : page scroll control
		
		
		//create composite viewport
		var ps = lastSession;
		
		if(_.isEmpty(lastSession))
			return;
		
		ps.clientViewport = {
				vx: 0,
				vy: 0,
				width : 0,
				height : 0,
				px : 0,
				py : 0,
				widthPixel : 0,
				heightPixel : 0,
		};
		var comView = {
				vx: 0,
				vy: 0,
				width : 0,
				height : 0
		};
		
		//ver 0.1 : assumption - all screens have same size, same orientation
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
				session.clientViewport.px = session.clientViewport.vx;
				session.clientViewport.py = session.clientViewport.vy;
				session.clientViewport.widthPixel = session.clientViewport.width;
				session.clientViewport.heightPixel = session.clientViewport.height;

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
				
				session.clientViewport.px = session.clientViewport.vx;
				session.clientViewport.py = session.clientViewport.vy;
				session.clientViewport.widthPixel = session.clientViewport.width;
				session.clientViewport.heightPixel = session.clientViewport.height;

				
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
	
	resizeOf : function(s, resolution) {
		var session = sessionList[s];
		session.clientResolution.width = resolution.width;
		session.clientResolution.height = resolution.height;
		
	},
	
	manageRender: function(img) {
		
		var viewport = _webdriver.getViewport();	
		img["image"] = "data:image/jpeg;base64," + img["image"] ;
		
		//var bufferdImage = new Buffer(img["image"], 'base64');
		var bufferedImage = img.image;
		var image = new Image;
		var url = img.url;
		var width = img.width;
		var height = img.height;
		image.onload = function() {
			for(var s in sessionList) {

				process.nextTick((function(ss) {
					return function() {
						//console.log('work', ss);
						var session = sessionList[ss];
						
						var segCanvas = canvasList[ss];
						var segCtx = segCanvas.getContext('2d');
						var segmentImg = {};

						segCtx.drawImage(image, session.clientViewport.px, session.clientViewport.py, session.clientViewport.widthPixel, session.clientViewport.heightPixel,
								0,0, session.clientResolution.width, session.clientResolution.height);	
						
						segmentImg["url"] = url;
						segmentImg["width"] = width;
						segmentImg["height"] = height;
						segmentImg["image"] = segCanvas.toDataURL();
						segmentImg["index"] = session.index;
						segmentImg["id"] = session.id;
						segmentImg["viewport"] = session.clientViewport;
						segmentImg["pageViewport"] = viewport; 
						
						_webdriver.manageRender(ss, segmentImg);
					};
				})(s));	
			}
		};
		
		image.onerror = function(err) {
			console.error(err);
		}
		image.src = bufferedImage;
		
		totalRenderView = img;
	},
	
	removeAllGuide : function () {
		
		guideIndex = 0;
		guideList = [];
		guidePoints = {};
		guidedViewports = {};
		
	},
	
	addGuide : function(sid, angle, mode, pos, ori){
		var s = module.exports.getSession(sid);

		guideIndex = guideList.length;
		
		//checking
		if( ((guideIndex+1) % 2) == (mode % 2)) {
			guideList[guideIndex] = { id: s.id, angle: angle, position : pos, orientation: ori, mode : mode};
		}

		console.log("Guide Added : " );
		console.log(guideList[guideIndex ]);
		console.log("----");
		
		guideIndex = guideIndex + 1;
		
		if( (guideIndex % 2) == 0) {
			module.exports.calculateViewport();
		}
		
		module.exports.checkGuides();
		
	},
	
	// s as socket
	getGuideListOf : function ( sid ) {
		var s = module.exports.getSession(sid);
		var list = [];
		var i = 0;
		for (; i<guideList.length; i++) {
			if( guideList[i].id == sid)
				list.push(guideList[i]);
		}
		
		return list;
	},
	
	checkGuides : function() {
		var i = 0;
		for( i = 0 ; i< guideList.length; i++) {
			if( module.exports.getSession(guideList[i].id) === undefined ) {
				delete guidedViewports[guideList[i].id];
				//guideList.splice(i, 1);
				if( i % 2 == 0 && guideList[i+1] !== undefined)
					guideList.splice(i,2);
				else if (i % 2 == 1 && guideList[i-1] !== undefined)
					guideList.splice(i-1, 2);
			}
			
		}
		guideIndex = guideList.length;
		
			
	},
	
	calculateViewport : function() {
		
		console.log("calcualting viewport...");
		
		module.exports.checkGuides();
		
		
		// if there is no guides, treat it as classic
		if( guideIndex < 2 && _.isEmpty(guidedViewports) ) {
			console.log("there is no guides, treating it as classic....");
			module.exports.autoAlign();
			module.exports.setGuideMode(0);
			return module.exports.getGuideMode();
		}
		
		var i = 0;		
		for( i = 0 ; i < (guideIndex) / 2 ; i++) {

			 var source = guideList[2 * i ];
			 var target = guideList[2 * i + 1];
			 
			 
			 if(source === undefined)
				 break;
			 if(target === undefined)
				 break;
			 
			 var sourceS = module.exports.getSession(source.id);
			 var targetS = module.exports.getSession(target.id);
			 
			 var pairI = -1;
			 var scaleFactor = 1;
			 
			 //find a pair of guides from same src and tar
			 var j = i+1;
			 for ( ; j< (guideIndex)/2 ; j++) {
				 
				 var s2 = guideList[2 * j ];
				 var t2 = guideList[2 * j + 1];
				 
				 var s2S = module.exports.getSession(s2.id);
				 var t2S = module.exports.getSession(t2.id);
				 	 
				 if( (s2S == sourceS && t2S == targetS ) || (s2S == targetS && t2S == sourceS)) {
					 pairI = j;
					 break;
				 }
			 }
			 
			 if( pairI != -1 ) {
				 var s2 = guideList[2 * pairI ];
				 var t2 = guideList[2 * pairI + 1];
				 
				 var s2S = module.exports.getSession(s2S.id);
				 var t2S = module.exports.getSession(t2S.id);
				 
				 if( (s2S == targetS && t2S == sourceS)) {
					 var tmp = s2;
					 s2 = t2;
					 t2 = tmp;
				 }
				 
				 var dx1, dx2, dy1, dy2;
				 // why does DPR not need? 
				 dx1 = (source.position.x - s2.position.x) ;
				 dy1 = (source.position.y - s2.position.y) ;
				 
				 dx2 = (target.position.x - t2.position.x) ;
				 dy2 = (target.position.y - t2.position.y) ;

				 if( dx1 != dx2) {
					 scaleFactor = dx1/dx2; //for target
				 } else if ( dy1 != dy2 ) {
					 scaleFactor = dy1/dy2;
				 }
				 

				
				 if( guidedViewports[source.id] === undefined )
					 guidedViewports[source.id] = {
						 vx : 0, vy : 0, px : 0, py: 0,
						 width: sourceS.clientResolution.width , height : sourceS.clientResolution.height,
						 widthPixel : 0, heightPixel : 0,
						 
				 	};
				 if (guidedViewports[target.id] === undefined ) 
					 guidedViewports[target.id] = {
						 vx : (guidedViewports[source.id].vx + source.position.x)  - target.position.x  * scaleFactor , vy : (guidedViewports[source.id].vy  + source.position.y)  - target.position.y  * scaleFactor , 
						 px : 0  , py : 0 , 
						 
						 width: targetS.clientResolution.width * scaleFactor, height : targetS.clientResolution.height * scaleFactor ,
						 widthPixel : 0, heightPixel : 0, 
						 
				 	};
				 
				 
				 
				 var minx = 0, miny = 0, maxx = 0, maxy = 0;
				 var totalviewport = {width : 0, height: 0};
				 for( var ss in guidedViewports) {
					 if( guidedViewports[ss].vx <= minx)
						 minx = guidedViewports[ss].vx;
					 if( guidedViewports[ss].vy  <= miny)
						 miny = guidedViewports[ss].vy ;
					 if( guidedViewports[ss].vx + guidedViewports[ss].width >= maxx)
						 maxx = guidedViewports[ss].vx + guidedViewports[ss].width;
					 if( guidedViewports[ss].vy + guidedViewports[ss].height >= maxy)
						 maxy = guidedViewports[ss].vy + guidedViewports[ss].height;
				 }
				 
				 totalviewport.width = Math.round(maxx - minx);
				 totalviewport.height = Math.round(maxy - miny);
				 
				
				 for( var ss in guidedViewports) {
					 var vs = module.exports.getSession(ss)
					 guidedViewports[ss].px = guidedViewports[ss].vx - Math.round(minx) ;
					 guidedViewports[ss].py = guidedViewports[ss].vy - Math.round(miny) ;
					 guidedViewports[ss].widthPixel = guidedViewports[ss].width ;
					 guidedViewports[ss].heightPixel = guidedViewports[ss].height ;
					 
					 module.exports.setSessionViewport( ss, guidedViewports[ss]);
					 
				 }
				 
				 
				 module.exports.setViewport(totalviewport);
				 
				 console.log("calculated viewport size : ");
				 console.log(totalviewport);
				 
			 }

		}
		
	},
	
	
	
	setGuideMode : function( m ) {
		guideMode = m;
	},
	
	getGuideMode : function() {
		return guideMode;
	},

	
	getTotalRenderView : function() {
		return totalRenderView;
	},
	
	setViewport : function(viewport) {
		_webdriver.setViewport(parseInt(viewport.width), parseInt(viewport.height));
	},
	
	setSessionViewport : function(s, viewport) {
		if(sessionList[s] !== undefined && viewport !== undefined)
			sessionList[s].clientViewport = viewport;
		else
			console.error("Session Fault : Session " + s + " doesn't exist");
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