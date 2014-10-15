/**
 * New node file
 */
var socket = io.connect();
var currentUrl;
var pastUrl;
var pastUrl;
var pageViewport = {width: 1280, height:960};
var viewport;
var webview;
$( document ).ready( function(){
	
	webview = $("#web_view");
	eventHandler.init(webview, socket);
	
	$('#toggleBt').on('click', function(){
		
		$('#header-bar').slideToggle("fast");

	});
	
	$(window).resize(function(){
		
		/*
		webview.get(0).width = window.innerWidth;
		webview.get(0).height = window.innerHeight;

		
		socket.emit('hello', 'guys', {
			clientResolution: { width : webview.width(), 
				height: webview.height()
				}
		});
		*/
	});

	console.log("Trying to connect mswebviewer-server");

	$('#screenSet').on('click', function(){
		$('#screenSetModal').dialog({
	       
	        resizable: false,
	        width:'auto',
	        height:'auto',
	        modal: true,
	        close: function(e, u) {
	        	$("#rectangleArea").empty();
	        }
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
		
		pageViewport = data.pageViewport;
		image.src = data.image;
	
		//image.src = "data:image/jpeg;base64," + data.image;
		
		//canvas operation - scaling down

		image.onload = function() {
			ctx.rect(0,0, canvas.width, canvas.height);
			ctx.fillStyle = "white";
			ctx.fill();
		    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
		};
		$("#pWidth").val(pageViewport.width);
		$("#pHeight").val(pageViewport.height);
		
	});
	
	$("#pWidth").keydown(function(event) {
		// Allow only backspace and delete
		if ( event.keyCode == 46 || event.keyCode == 8 ) {
			// let it happen, don't do anything
		}
		else {
			// Ensure that it is a number and stop the keypress
			if (event.keyCode < 48 || event.keyCode > 57 ) {
				event.preventDefault();	
			}	
		}
	});
	$("#pHeight").keydown(function(event) {
		// Allow only backspace and delete
		if ( event.keyCode == 46 || event.keyCode == 8 ) {
			// let it happen, don't do anything
		}
		else {
			// Ensure that it is a number and stop the keypress
			if (event.keyCode < 48 || event.keyCode > 57 ) {
				event.preventDefault();	
			}	
		}
	});
	
	$("#setViewport").on('click', function(e){
		pageViewport.width  = $("#pWidth").val();
		pageViewport.height = $("#pHeight").val();
		setViewport();
	});
	
	socket.on('sessionList', function(list){

		var canvas = $("#total_view").get(0);
		
		for( var s in list) {
			var newRect = $(document.createElement('div'));
			newRect.attr("id",s);
			var x = list[s].clientViewport.vx;
			var y = list[s].clientViewport.vy;

			var w = list[s].clientViewport.width;
			var h = list[s].clientViewport.height;
			
			
			x = x * canvas.width / pageViewport.width;
			y = y * canvas.height / pageViewport.height;
			w = w * canvas.width / pageViewport.width;
			h = h * canvas.height / pageViewport.height;
		
			
			newRect.css( "border", 1);
			//TODO : let color be random!
			newRect.css( 'border-color', "red");
			newRect.css( 'border-style', "dashed")
			newRect.css( "position", "absolute");
			newRect.css( "left", x);
			newRect.css( "top", y);
			newRect.css( "width",  w);
			newRect.css("height",h);
			newRect.resizable({ 
				resize: function(e, u){
					var rw = u.size.width * pageViewport.width / canvas.width;
					var rh = u.size.height * pageViewport.width / canvas.height;
					list[s].clientViewport.width= rw;
					list[s].clientViewport.height = rh;
					
					socket.emit("setSessionViewport",  u.originalElement.get(0)["id"],  list[s].clientViewport);
					
				},
			});
			newRect.draggable({ 
				drag: function(e, u){
					var rx = u.position.left * pageViewport.width / canvas.width;
					var ry = u.position.top * pageViewport.width / canvas.height;
					
					 list[s].clientViewport.vx= rx;
					 list[s].clientViewport.vy = ry;
					socket.emit("setSessionViewport",   u.helper.get(0)["id"],  list[s].clientViewport);
					
				},
			});
			
			
			$("#total_viewDiv").append(newRect);
			//$("#rectangleArea").append(newRect);
			
			
		}
	});

	socket.on('renderData', function(data){
		currentUrl = data.url;
		if(pastUrl != currentUrl) {
			pastUrl = currentUrl;
			$("#gotourl").val(currentUrl);
		}
		$("#sessionNum").text(data.id);
		
		viewport = data.viewport;
		var canvas = $("#web_view").get(0);
		var ctx = canvas.getContext("2d");
		var image = new Image();
		

		//image.src = data.image;
		
		//image.src = new Buffer("data:image/jpeg;base64," + data.image, 'base64');
		image.src = "data:image/jpeg;base64," + data.image;
		
		image.onload = function() {
			//ctx.rect(0,0, canvas.width, canvas.height);
			//ctx.fillStyle = "white";
			//ctx.fill();
			
			ctx.drawImage(image, viewport.vx, viewport.vy, viewport.width, viewport.height,
					0,0, canvas.width, canvas.height);
		
		};
		
	});

	socket.on('command', function(data){
		
	});

	
});

function setViewport() {
	socket.emit("setViewport", pageViewport);
}

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

