
var _currentURL;

var _sessionManager;
var currentPage;

module.exports = {
	
	init: function(sessionManager) {
		_sessionManager = sessionManager;
	},
	repeater : function(base64) {
		var data = { url: _currentURL
					, width: '1280'
					, height: '960'
					, image: base64
					};
		_sessionManager.manageRender(data);
		currentPage.evaluate(function() {
			if(document.body !== null)
				document.body.bgColor = 'white';
		});
		
		setTimeout( function(){
			currentPage.renderBase64('JPEG', function(arg){module.exports.repeater(arg)});
		}, 24/1000
		);
	},
	
	rendering : function( page, status) {
		page.get("url", function(r){
			_currentURL = r;
		}); 
		
		page.evaluate(function() {
		    document.body.bgColor = 'white';
		});
		
		currentPage = page;
		page.renderBase64('JPEG', function(base64){module.exports.repeater(base64)});
	},

};