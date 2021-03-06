/**
 * New node file
 */

//var io = require('socket.io-client');
//var blobToImage = require('./blob');
var socket = io.connect();
var currentUrl;
var pastUrl;
var pageViewport = {width: 1280, height:960};
var viewport;
var webview;
var lastImage;
var initialY = null,
previousY = null,
bindScrollEvent = function(e){

	var event = e.originalEvent;
    previousY = initialY = event.touches[0].clientY;
    
    var element = $("#"+this.id);

    // Pull to reload won't be activated if the element is not initially at scrollTop === 0
    if(element[0].scrollTop <= 0){
        element.on("touchmove", blockScroll);
    }
},
blockScroll = function(e){

	var event = e.originalEvent;
	var element = $(this.id);
    if(previousY && previousY < event.touches[0].clientY){ //Scrolling up
        event.preventDefault();
    }
    else if(initialY >= event.touches[0].clientY){ //Scrolling down
        //As soon as you scroll down, there is no risk of pulling to reload
        element.off("touchmove");
    }
    previousY = event.touches[0].clientY;
},
unbindScrollEvent = function(e){
	var element = $(this.id);
	element.off("touchmove");
};


$( document ).ready( function(){

	webview = $("#web_view");
	eventHandler.init(webview, socket);
	$.mobile.loading().hide();
	$(document).delegate(".ui-content", "scrollstart", false);
	
	$(document).delegate('*', 'touchmove',function(e)
			{
			    if ($(this) !== $('#cal_view'))
			    {
			        e.preventDefault();
			        //and /or
			        return false;
			    }
			    //current event target is $altNav, handle accordingly
			});
	
	
	$('#toggleBt').on('click', function(){
		
		$('#header-bar').slideToggle("fast");
		socket.emit('closeOthersBar');

	});
	
	//var scaleGrid = document.getElementById('cal_view');
	var scaleGrid = $('#cal_view');
    var scaleContext = scaleGrid[0].getContext('2d');
    
    var calibrator = new Calibrator(); 
    calibrator.scaleGrid = scaleGrid[0];
    calibrator.scaleContext = scaleContext;
    
    scaleGrid.on("touchstart", bindScrollEvent);
    scaleGrid.on("touchend", unbindScrollEvent);
     
    calibrator.scaleContext.canvas.width = window.innerWidth;
    calibrator.scaleContext.canvas.height = window.innerHeight;
    
    calibrator.W = scaleGrid[0].width;
    calibrator.H = scaleGrid[0].height;
    
    
    calibrator.clearCanvas();
    
    calibrator.drawGuide ( calibrator.scaleContext, scaleGrid.width, scaleGrid.height);

    
	$(window).resize(function(){
		    
		
		webview.get(0).width = window.innerWidth;
		webview.get(0).height = window.innerHeight;

		
		socket.emit('resizeing',  { width : window.innerWidth, 
				height: window.innerHeight
		});
		
	});

	console.log("Trying to connect mswebviewer-server");

	$('#screenSet').on('click', function(){
		console.log("call dialog");
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
	
	$('#removeAllGuides').on('click', function(e){
		socket.emit('removeAllGuide');
	});
	
	$('#cal_view').on('click', function(e){

		var m = calibrator.clickCalView( e) ;
		var ori = 0;
		var message = '';
		var arrowAngle = calibrator.getArrowAngle();
		var edgePoint = calibrator.getEdgePoint();
		
		if( m > 10) {
			var sinangle = Math.sin(arrowAngle);
			if( sinangle < 0.0001 && sinangle > -0.0001 )
				ori = 0;
			else
				ori = 1;
		}
		
		if( m == 11) {
			console.log(arrowAngle);
			message = 'outward';
			socket.emit(message, arrowAngle, edgePoint, ori);
		} 
		else if(m == 21) {
			message = 'inward';
			socket.emit(message, arrowAngle, edgePoint, ori);
		} else {
			;
		}
		
	});
	
	
	$('#cal_view').on('touchstart', function(e){

		var m = calibrator.clickCalView( e) ;
		
		
	});
	

	$('#cal_view').on('touchend', function(e){

		var m = calibrator.clickCalView( e) ;
		var ori = 0;
		var message = '';
		var arrowAngle = calibrator.getArrowAngle();
		var edgePoint = calibrator.getEdgePoint();
		
		if( m > 10) {
			var sinangle = Math.sin(arrowAngle);
			if( sinangle < 0.0001 && sinangle > -0.0001 )
				ori = 0;
			else
				ori = 1;
		}
		
		if( m == 11) {
			console.log(arrowAngle);
			message = 'outward';
			socket.emit(message, arrowAngle, edgePoint, ori);
		} 
		else if(m == 21) {
			message = 'inward';
			socket.emit(message, arrowAngle, edgePoint, ori);
		} else {
			;
		}
		
	});
	
	
	$('#finishCal').on('click', function(){
		
		socket.emit('guideModeOff');

		calibrator.stopWindowFrame();
		$('#calibrationMode').hide();
		
		$('#header-bar').show("slide");
		socket.emit('closeOthersBar');

	});
	
	$('#screenCal').on('click', function(){

		//enter Mode
		socket.emit('guideModeOn');
		
	});
	

	
	webview.width(window.innerWidth);
	webview.height( window.innerHeight);

	socket.emit('hello', 'guys', {
		clientResolution: { width : webview.width(), 
			height: webview.height()
			},
		devicePixelRatio : window.devicePixelRatio
	});
	socket.on('confirmed', function(data){
		console.log("Session established - " + data);
	});
	
	socket.on('closeBar', function(){
		$('#header-bar').hide("slide","fast");
	});
	
	socket.on('mode', function(id, m) {
		
		console.log("Guide Mode : " + m);
		calibrator.mode = m;
		if(m > 0) {

			$('#calibrationMode').show();

			//drawing 

		    calibrator.drawGuide ( scaleContext, scaleGrid[0].width, scaleGrid[0].height);

		} else {
			calibrator.stopWindowFrame();
			$('#calibrationMode').hide();
		}
	});
	
	socket.on('arrowList', function( list ) {

		calibrator.arrowList = list;
		
		calibrator.clearCanvas();
		calibrator.drawPastGuides();
		console.log("arrowList received");
		
	});
	
	socket.on('totalRenderView', function(data){
		
		var canvas = $("#total_view").get(0);
		var ctx = canvas.getContext("2d");
		var image = new Image();
		
		image.onload = function() {
			ctx.rect(0,0, canvas.width, canvas.height);
			ctx.fillStyle = "white";
			ctx.fill();
		    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
		};		
		
		pageViewport = data.pageViewport;

		//canvas operation - scaling down
		if( data.image != "" ) {
			image.src = data.image;
		}	
		
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
					list[s].clientViewport.widthPixel= rw;
					list[s].clientViewport.heightPixel = rh;
					
					socket.emit("setSessionViewport",  u.originalElement.get(0)["id"],  list[s].clientViewport);
					
				},
			});
			newRect.draggable({ 
				drag: function(e, u){
					var rx = u.position.left * pageViewport.width / canvas.width;
					var ry = u.position.top * pageViewport.width / canvas.height;
					
					 list[s].clientViewport.vx= rx;
					 list[s].clientViewport.vy = ry;
					 list[s].clientViewport.px= rx;
					 list[s].clientViewport.py = ry;
					socket.emit("setSessionViewport",   u.helper.get(0)["id"],  list[s].clientViewport);
					
				},
			});
			
			$("#rectangleArea").append(newRect);
			
			
		}
	});

	socket.on('renderData', function(data){
		currentUrl = data.url;
		if(pastUrl != currentUrl) {
			pastUrl = currentUrl;
			$("#gotourl").val(currentUrl);
		}
		$("#sessionNum").val(data.id);
		
		viewport = data.viewport;

		
		//webview.src = blobToImage(data.image);
		
		webview.get(0).src = data.image;
		webview.width ( window.innerWidth);
		webview.height (window.innerHeight);

		lastImage = webview.get(0).src;
		
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

	}});
	socket.emit('closeOthersBar');

}

