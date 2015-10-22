var phantom = require('phantom');

var phdriver;
var currentURL;
var phPage;

var _renderCtrl;
var _sessionManager;
var _socketCtrl;
var viewport;


module.exports = {
		init : function (renderCtrl, sm, socketCtrl) {
			_renderCtrl = renderCtrl;
			_sessionManager = sm;
			_socketCtrl = socketCtrl;
			viewport = { width: 1280, height:960};

			phantom.create( "--ignore-ssl-errors=yes",{ binary: '/usr/local/bin/phantomjs', port: 12345}, 
				function (ph) {
			    	console.log("Phantom Bridge Initiated with PID " + ph.process.pid);
			    	phdriver = ph;
			    	phdriver.createPage(function (page) {
						phPage = page;
						phPage.set('viewportSize', viewport);  
						console.log("Phantom Page created.")
						
						_sessionManager.init(module.exports);
						_renderCtrl.init(_sessionManager, phPage);
						
					});
			    	
			});
			
		},
		
		setViewport: function( w, h) {
			viewport = { width: w, height:h };
			if( phPage !== undefined) {
				phPage.set('viewportSize',viewport);  
		
			}
		},

		getViewport : function() {
			return viewport;
		},

		startRendering : function() {
			_renderCtrl.rendering();
		},
		stopRendering : function() {
			_renderCtrl.stopRendering();
		},
		
		manageRender : function(sid, data) {
			
			
			_socketCtrl.manageRender(sid, data);
		},
		
		sendEvent : function(e) {
			
			//phantomjs

			if( phPage !== undefined) {
				// maybe its event pageX
				if(e.type.indexOf("click") != -1 || e.type.indexOf("mouse") != -1){
					phPage.sendEvent(e.type, e.pageX, e.pageY ,e.button);
				}	
				else if(e.type.indexOf("key") != -1) {
					
					if(e["modifier"] == undefined)
						e["modifier"] = 0;
					
					phPage.sendEvent(e.type, e.which, null, null,e.modifier);
				}
			}	
		},
		
		gotourl : function(req, res) {
			
			var url = req.query.url;
			currentURL = url;
			console.log("go to " + url);
			
			phPage.open(url, function (status) {
				console.log("opened url? ", status);
				_renderCtrl.rendering(status);
			  
			});
			//}, { binary: '/usr/local/bin/phantomjs',});
			//,onStdout: module.exports.stdOutHdlr});
			
		},	
		
		die : function() {
			if(phdriver !== undefined) {
				phdirver.exit('SIGINT');
			}
		}
		
}