/**
 * New node file
 */
var socket = io.connect();
var currentUrl;
var pastUrl;
var pastUrl;
var webview;
$( document ).ready( function(){
	
	webview = $("#web_view");
	eventHandler.init(webview, socket);
	
	$('#toggleBt').on('click', function(){
		
		$('#header-bar').slideToggle("fast");

	});
	console.log("Trying to connect mswebviewer-server");

	$('#screenSet').on('click', function(){
		$('#screenSetModal').dialog({
	       
	        resizable: false,
	        width:'auto',
	        height:'auto',
	        modal: true
	 });
		socket.emit('requestTotalRenderView');
		socket.emit('requestSessionList');
	});
	
	webview.get(0).width = window.innerWidth;
	webview.get(0).height = window.innerHeight;

	socket.emit('hello', 'guys', {
		clientResolution: { width : webview.width(), 
			height: webview.height()
			}
	});
	socket.on('confirmed', function(data){
		console.log("Session established - " + data);
	});
	
	socket.on('totalRenderView', function(data){
		
		var canvas = $("#total_view").get(0);
		var ctx = canvas.getContext("2d");
		var image = new Image();
		
		image.src = "data:image/jpeg;base64," + data.image;
		
		//canvas operation - scaling down

		image.onload = function() {
		    ctx.drawImage(image, 0, 0, 320, 240);
		};
	});
	
	socket.on('sessionList', function(list){
		console.log("sessionList");
		console.log(list);
		for( var s in list) {
			var newRect = document.createElement('div');
			console.log(list[s]);
			
			//$("#screenSetModal").append(newRect);
			
			
		}
	});

	socket.on('renderData', function(data){

		currentUrl = data.url;
		if(pastUrl != currentUrl) {
			pastUrl = currentUrl;
			$("#gotourl").val(currentUrl);
		}
		$("#sessionNum").text(data.id);
		
		_width = data.width;
		_height = data.height;
		
		var viewport = data.viewport;
		var canvas = $("#web_view").get(0);
		var ctx = canvas.getContext("2d");
		var image = new Image();
		
		image.src = "data:image/jpeg;base64," + data.image;

		image.onload = function() {
			//ctx.rect(0,0, canvas.width, canvas.height);
			//ctx.fillStyle = "white";
			//ctx.fill();
			
		    //ctx.drawImage(image, 0, 0);
			ctx.drawImage(image, viewport.vx, viewport.vy, viewport.width, viewport.height,
					0,0, canvas.width, canvas.height);
		
		};
		
	});

	socket.on('command', function(data){
		
	});

	
});

var gotourl = function() {
	
	//TODO : URL parsing
	var url = $("#gotourl").val();
	pastUrl = currentUrl = url;

	$.ajax({type: "GET",
        url: "/goto",
        data: { url: url,  },
        success:function(result){
        	var canvas = $("#web_view").get(0);
        	var ctx = canvas.getContext("2d");

        	var image = new Image();
        	image.src = "data:image/png;base64," + result.image;
        	image.onload = function() {
        	    ctx.drawImage(image, 0, 0);
        	};
        	
	}});
}

