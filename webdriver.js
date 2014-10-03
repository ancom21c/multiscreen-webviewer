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
			_sessionManager.init(module.exports);
			_renderCtrl.init(_sessionManager);
			viewport = { width: 1280, height:960};
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
		
		manageRender : function(sid, data) {
			
			_socketCtrl.manageRender(sid, data);
		},
	
		sendEvent : function(e) {
			if( phPage !== undefined) {
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
			
			phantom.create(function (ph) {
				phdriver = ph;
				ph.createPage(function (page) {
					phPage = page;
					phPage.set('viewportSize', viewport);  
					
					phPage.open(url, function (status) {
						console.log("opened url? ", status);
						_renderCtrl.rendering(phPage, status);
					  
					});
				});
			}, { binary: '/usr/local/bin/phantomjs',});
			//,onStdout: module.exports.stdOutHdlr});
			
		},	
		
}