var Parallel = require('paralleljs');

var _currentURL;

var _sessionManager;
var currentPage;
var timer = 0;
var TIME = 10;
var prt = [0, 0];

module.exports = {
	
	init: function(sessionManager, page) {
		_sessionManager = sessionManager;
		currentPage = page;
	},
	repeater : function() {
		var data = { url: _currentURL
					, width: '1280'
					, height: '960'
					};
		
//		if( base64 == "") {
//			console.error("page not rendered... retrying");
//			//currentPage.renderBase64('JPEG', module.exports.repeater);
//		} else {
			var prtdiff = process.hrtime(prt);
			var n = prtdiff[0] * 1e9 + prtdiff[1];
//			console.log('previous rendering took ' + n.toLocaleString() + " ns");
		
			var time = process.hrtime();
			_sessionManager.manageRender(data);
			var diff = process.hrtime(time);
			n = diff[0] * 1e9 + diff[1];
//			console.log('sessionManager.manageRender took ' + n.toLocaleString() + " ns");
			
			var prtdiff2 = process.hrtime(prt);
			n = prtdiff2[0] * 1e9 + prtdiff2[1];
//			console.log('one cycle took ' + n.toLocaleString() + " ns");

			
			setTimeout( function() {
				if (timer == 0 ) {
					console.log("rendering stopped");
					return;
				}
				prt = process.hrtime();
				currentPage.evaluate(function() {
					if(document.body !== null)
						document.body.bgColor = 'white';
				});

				//currentPage.renderBase64('JPEG', module.exports.repeater);
				currentPage.render('save.jpg', {format: 'jpeg', quality: '100'}, module.exports.repeater );
				
			}, TIME );
//		}
		
	

	},
	
	rendering : function( status) {
		
		timer = 1;
		
		currentPage.get("url", function(r){
			_currentURL = r;
		}); 
		
		currentPage.evaluate(function() {
		    document.body.bgColor = 'white';
		});
		
//		if (timer !== undefined)
//			clearInterval(timer);
//		
		//start rendering
		prt = process.hrtime();
		currentPage.renderBase64('JPEG', module.exports.repeater );
		
//		var timer = setInterval( function(){
//			prt = process.hrtime();
//			currentPage.evaluate(function() {
//				if(document.body !== null)
//					document.body.bgColor = 'white';
//			});
//			currentPage.render('save.jpg', {format: 'jpeg', quality: '100'}, module.exports.repeater );
//		}, TIME);
		
	},
	
	stopRendering : function() {
		
		timer = 0;
	}

};