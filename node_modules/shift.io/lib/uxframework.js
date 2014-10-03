/** @module uxFramework-client 
 *  @author Sanghong An, ancom21c@kaist.ac.kr; Hyeontaek Oh, hyeontaek@kaist.ac.kr
 *  @version 0.6.1
 *
 *  @requires socket.io-client:0.9.11
 *  @requires jquery:>1.7.0
  */

/*global language, console, whatever, cool, lib, $ */

/** 
* socketIO server instance
* @constant */
//var uxFrameworkServerLoc = "kaisqr.kaist.ac.kr:9999";

if (typeof uxFrameworkServerLoc === "undefined")
	uxFrameworkServerLoc = window.location.host;
if (typeof uxFrameworkHandleIcon === "undefined")
	uxFrameworkHandleIcon = "http://kaisqr.kaist.ac.kr/uploads/images/handover_ico.png";

if (typeof device_img_pc === "undefined")
	device_img_pc = "http://icons.iconarchive.com/icons/siristhius/vista-style/256/My-computer-icon.png";
if (typeof device_img_android === "undefined")
	device_img_android = "http://tour.barnesfoundation.org/android.png";
if (typeof device_img_android_pad === "undefined")
	device_img_android_pad = "http://www.mobilitat.com/assets/65/tablet-icon.png";
if (typeof device_img_iphone === "undefined")
	device_img_iphone = "http://files.softicons.com/download/system-icons/windows-8-metro-invert-icons-by-dakirby309/png/256x256/Devices%20&%20Drives/iPhone.png";
if (typeof device_img_ipod === "undefined")
	device_img_ipod = "http://png-5.findicons.com/files/icons/1253/flurry_extras/256/ipod.png";
if (typeof device_img_ipad === "undefined")
	device_img_ipad = "http://www.endlessicons.com/wp-content/uploads/2012/12/ipad-icon-614x460.png";	


var url = uxFrameworkServerLoc;

var 
	server = io.connect('http://' + url)
;

var sessionID="";
var name = "";
// YOUTUBE: VARIABLES
// youtube video array (every youtube video instance)
var youtube_videos = [];
var flag_youtube = 0;
// END YOUTUBE: VARIABLES
var device = ""; 
var device_img = "";
var user_img = "";
/** Javascript Initializer */    
$(function () {

    console.log("UXFramework Initializing start...");
    var n = 0;
    // YOUTUBE: API LOADING
    var youtube_api = document.createElement('script');
    youtube_api.src = "//www.youtube.com/iframe_api";
    var first_script_tag = document.getElementsByTagName('script')[0];
    first_script_tag.parentNode.insertBefore(youtube_api, first_script_tag);
    // END YOUTUBE: API LOADING
    
    /** Attach object container and handle to class "transferrable" **/
    $(".transferrable").each(function () {
    	var id = $(this)[0].id;
    	
    	var img = $(document.createElement('img'));
    	var div = $(document.createElement('div'));
       
       var left = -15;
       var top = -15;
       
       /** @todo : custom handle icon setter */
       /** @todo : custom sending event listener setter with property */
       /** @todo : custom receiving event listener setter */
       div.attr('id', id + "_div");
       img.attr('src', uxFrameworkHandleIcon );
       img.attr('id', id + "_drag");
       img.attr('width', "30px");
       img.attr('height', "30px");
       img.css({'left': left, 'top': top, position: 'absolute', 'opacity' : 0.5}); 
       img.addClass("dragbar");
    	
       $(this).before(div);
       $(this).remove();
    	div.append(img);
    	div.append($(this));
    	div.draggable({handle: img, opacity: 0.5, cursor: 'move', revert: true, revertDuration: 900});
    });
    
   // 130502 SESSION: EXISTENCE CHECK 
    //Checking session


    if (/iphone/i.test(navigator.userAgent.toLowerCase())){
        device = "iphone";
        device_img = device_img_iphone; 
    }
    else if(/ipad/i.test(navigator.userAgent.toLowerCase())){
        device = "ipad";
        device_img = device_img_ipad;
    }
    else if(/ipod/i.test(navigator.userAgent.toLowerCase())){
        device = "ipod";
        device_img = device_img_ipod;
    }
    else if(/android/i.test(navigator.userAgent.toLowerCase())){
        if (/mobile/i.test(navigator.userAgent.toLowerCase())){
            device = "android phone"
            device_img = device_img_android;
        }
        else {
            device = "android tablet";
            device_img = device_img_android_pad;
        }
    }
    else{
        device = "PC";
        device_img = device_img_pc;
    }

    server.emit('sessionHandshake',serviceSID);
    server.emit('sessionCheck');
    server.on('sessionCheck', function(userKey, sID) {
		sessionID = sID;
        server.emit('setSessionOption', 'device', device);
	});
    
	console.log("Initializing ended...");
	
});

// YOUTUBE: ONREADY API
// find youtube videos
function onYouTubeIframeAPIReady() {
	$(".transferrable").each(function () {
	if ($(this)[0].nodeName == "IFRAME" && $(this)[0].src.toString().toLowerCase().indexOf("youtu") >= 0)
	{
		var id = $(this)[0].id;
		youtube_videos[id] = new YT.Player(id);
	}
	});
}
// END YOUTUBE: ONREADY API

/**
 * Receive HTML Object from uxFramework Server.
 * !socket.io method!
 * @method receiveObject
 * @param {String} name - the ID of sender.
 * @param {String} obj - HTML String of receving object.
 * @param {String} ele - HTML element object of receiving object.
 */
  function receiveObject(name, obj, ele) {
   
    var div = $(document.createElement('div'));
    var obarea = $(document.createElement('div'));
    var button = $(document.createElement('button'));
    var label = $(document.createElement('div'));
    var attachedobj;
    var n = 0;
    
    
    // YOUTUBE: TARGET AREA ID
    obarea.attr('id','obarea');
    // END YOUTUBE: TARGET AREA ID
    
    div.draggable({containment: "parent", handle: label});
    //label.draggable();
    label.text("Data from " + name);
    label.css('font-size', '20px');

    button.text("close");
    button.css('font-size', '20px');
    button.click(function() {
        div.hide('slow', function() {
            div.remove();
        });
    });

    div.attr('id', 'blob');
    div.css('position', 'absolute');
    div.css('top', '50px');

    div.css('background','white');
    div.css('border', '1px solid #000000');

    div.hide();   
    div.html(label);
    div.append(obarea);
    div.append(button);
    $('body').append(div);
    
	var attachedobj = addReceivedObject(obarea, obj, ele);
        
    div.show("slow");

    return attachedobj[0].childNodes[0];
    
} 

function addReceivedObject(target, obj, ele) {
	var n = 0;
    var attachedobj = target.append(obj);
	applyAttributes( attachedobj[0], ele, n);
	
	return attachedobj;
 
}


 /**
 * Crowl the object tree and apply HTML attributes of the objects.
 * @method
 * @param {Object} obj - target HTML object.
 * @param {Object} ele - Container of attributes.
 * @param {Object} n - the index of current object in jsonobj.
 */
function applyAttributes ( obj, ele, n)
{
  var mode = 0;
  var isVideo = false;
  var isYouTube = false;
  var src = "";

  if(n > 0)		
  {
  	var tar = ele[n];
	  for ( var i in tar)
	  {
	    if ( i != 0 && i != 1 && i != "node_name")
	    {
	    	if( i == "dataurl" )
	    		continue;
	    	if( i == "id" )
	    	{
	    		if( tar["id"] != "")
	    			obj["id"] = tar["id"] + "_appended";
	    		continue;
	    	}	
			if( tar[i] == "CANVAS")
	    	{
	    	
		    	var data = tar["dataurl"];
		    	var width = tar["width"];
		    	var height = tar["height"];
			
		    	var ctx = obj.getContext("2d");
		    	/*
	    		var imagedata = ctx.createImageData(width, height);
	    		if(imagedata.data["set"])
	    		{
	    			imagedata.data.set(data.data);
	    		}
	    		else 
	    			for (i = 0; i < data.data.length; i++) 
			        	imagedata.data[i] = data.data[i];        
			        
		    	ctx.putImageData(imagedata,0,0);
		    	mode = 1;
		    */
			    var img = new Image;
				img.onload = function(){
				  ctx.drawImage(img,0,0); // Or at whatever offset you like
				};
				img.src = data;
	    	}
	    	
	
	    	if( tar[i] == "VIDEO" )
	    	{
	    		isVideo = true;
	    	}
	    	if( tar[i] == "IFRAME" )
	    	{
	    		isYouTube = true;
	    		flag_youtube = 1;
	    	}
	    	if( i == "src"  )
	    	{
	    		src = tar[i];
	    	}
	    	
	    	if( i == "currentTime" )
	    	{
	    		continue;
	    	}
	    	
	        obj[i] = tar[i];
	   	  	
	   	}
	   // YOUTUBE: LOAD AND APPLY ATTRIBUTE

	   	if( isYouTube && src.toString().toLowerCase().indexOf("youtu") && flag_youtube == 1 && obj["id"].toString().toLowerCase().indexOf("appended") > 0){
	   		console.log("youtube " + obj["id"]);
	   		

	   		youtube_videos[obj["id"]] = new YT.Player(obj["id"], {
				events: {
				'onReady': function(){
		                 youtube_videos[obj["id"]].seekTo(tar["currentTime"], false);
		                 if (tar["state"] == 1)
		                   youtube_videos[obj["id"]].playVideo();
		                 else if (tar["state"] == 2)
		                   youtube_videos[obj["id"]].pauseVideo();
		                 else 
		                   youtube_videos[obj["id"]].stopVideo();
		   
		                 if (tar["muted"] == 1)
		                   youtube_videos[obj["id"]].mute();
				}}
       		});

			flag_youtube = 0;
		}
	// END YOUTUBE: LOAD AND APPLY ATTRIBUTE
	   		
	   	/** @todo improve Autoplay */	
		    if(isVideo)
		    {
	
		    	obj.addEventListener('canplay', function() {
  					this.currentTime = tar["currentTime"];
  						
				});
				obj.addEventListener('loadstart', function() {
  					if(!tar["paused"])
			    	{
	  					obj.play();
	  				}
  					
				});
		    	obj.load();
		    	
		    	
		    	isVideo = false;
		    }
		  }
	  }   
	  n++;
	
	  for (var j = 0; j<obj.childNodes.length; j++)
	  {
	    
	    if(obj.childNodes[j].nodeType == 3 || obj.childNodes[j].nodeType == 8)
	    	continue;
	    applyAttributes( obj.childNodes[j], ele, n);
	  }
	
	}


server.on('receiveObject', receiveObject );


/**
 * Receive HTML Object from uxFramework Server.
 * !socket.io method!
 * @method receiveObjectWithFunc
 * @param {String} name - the ID of sender.
 * @param {String} obj - HTML String of receving object.
 * @param {String} ele - HTML element object of receiving object.
 * @param {String} func - Javascript function text
 */
server.on('receiveObjectWithFunc', function(name,  obj, ele, func) {
   	
	var attachedobj = receiveObject(name, obj, ele);
	
    var receivedfunc = new Function('obj', func);
    receivedfunc(attachedobj);

    

});

function addDroppable( target, id, type ) {
 	target.droppable({
        hoverClass: "ui-state-active",
        tolerance: "pointer",
       	drop: function(ev, ui) {
       		var dropped = ui.draggable;
       		dropped.css({top: 0, left:0, opacity:1});
       		var dragbar = $("#"+dropped[0].id+"_drag");
       		
       		$("#"+dropped[0].id+"_drag").remove();
       		
       		var droppedObj = $("#"+dropped[0].id.substr(0,dropped[0].id.length-4));
  
       		if(droppedObj.attr("receiver_event") != undefined ){
       			/** @TODO: function's toString() should not be overloaded 
       			 **/
       			var funcStr = window[droppedObj.attr("receiver_event")].toString();
       			console.log(funcStr);	
       			if(funcStr != undefined){
					funcStr = funcStr.substring(funcStr.indexOf('{'));
					if(type == "device") {
       					sendObjectToDeviceWithFunc($(this)[0].id, droppedObj , funcStr );
       				} else if(type == "user") {
       					sendObjectWithFunc($(this)[0].id, droppedObj , funcStr );
       				}
       			}
       		}
       		else {
       			if(type == "device") {
					sendObjectToDevice($(this)[0].id, droppedObj);
				} else if(type == "user") {
					sendObject($(this)[0].id, droppedObj);
				}
			}
			
			//Aftereffect
			dropped.append(dragbar);
			
			if(droppedObj.attr("sender_event") != undefined){
				$.globalEval(droppedObj.attr("sender_event"));
			}

       	}
 	});
 }

/**
 * Send HTML Object to target user via uxFramework Server.
 * @method
 * @param {String} id - the ID of receiver.
 * @param {String} objid - HTML ID of receving object.
 */
function sendObject(id, objid){
   var obj = objid;
   var objstr = getHTMLContents(obj[0]);
   var elestr = getHTMLElements(obj[0]);
   server.emit('sendObject', id, objstr, elestr);
}


/**
 * Send HTML Object to target user via uxFramework Server.
 * @method
 * @param {String} id - the ID of receiver.
 * @param {String} objid - HTML ID of receving object.
 */
function sendObjectWithFunc(id, objid, func){
   var obj = objid;
   var objstr = getHTMLContents(obj[0]);
   var elestr = getHTMLElements(obj[0]);
   /** @TODO function validation **/
   server.emit('sendObjectWithFunc', id, objstr, elestr, func);
}

/**
 * Send HTML Object to target device via uxFramework Server.
 * @method
 * @param {String} id - the ID of receiver.
 * @param {String} objid - HTML ID of receving object.
 */
function sendObjectToDevice (id, objid) {
   var obj = objid;

   var objstr = getHTMLContents(obj[0]);
   var elestr = getHTMLElements(obj[0]);

   server.emit('sendObjectToDevice', id, objstr, elestr);
   

}

/**
 * Send HTML Object to target device via uxFramework Server, with receiver's event listener function
 * @method
 * @param {String} id - the ID of receiver.
 * @param {String} objid - HTML ID of receving object.
 * @param {String} func - Receiver Event listener function.
 */
function sendObjectToDeviceWithFunc(id, objid, func){
   var obj = objid;
   var objstr = getHTMLContents(obj[0]);
   var elestr = getHTMLElements(obj[0]);
   /** @TODO function validation **/
   server.emit('sendObjectToDeviceWithFunc', id, objstr, elestr, func);
}

/**
 * Get HTML Contents of HTML object with String.
 * @method
 * @param {String} element - Element ID of HTML object.
 * @returns {String} - HTML String.
 */
function getHTMLContents(element)
{
   var str;
   if(window.XMLSerializer){
     var serializer = new XMLSerializer();
     str = serializer.serializeToString(element);

   }else{
     str = element.outerHTML;
   }
   return str;
}

/**
 * Get HTML Elements(properties) of HTML object.
 * @method
 * @param {Object} obj - target HTML object.
 * @returns {Object} - HTML attributes - value tree object.
 */
function getHTMLElements(obj)
{
  var jsonobj = new Object();
  var n = 1;
  jsonobj = getAttributesToObj( obj, jsonobj, n);
  return jsonobj;
}


/**
 * Crowl the object tree and retrieve HTML attributes of the objects.
 * @method
 * @param {Object} obj - target HTML object.
 * @param {Object} jsonobj - Container of attributes.
 * @param {Object} n - the index of current object in jsonobj.
 * @returns {Object} - JSONed object of attribute.
 */
function getAttributesToObj( obj, jsonobj, n )
{
  var attrobj = new Object();

  if(obj === undefined)
  {
  	console.error("Error : maybe the target object doesn't have ID");
  	return jsonobj;
  }
  	

  if(obj.hasOwnProperty("height"))
  	attrobj["height"] = obj["height"];
  if(obj.hasOwnProperty("width"))  	
  	attrobj["width"] = obj["width"];
  attrobj["node_Name"] = obj["nodeName"];
  if(!obj.hasOwnProperty("id"))
  {
  	console.log("ID required!");
  	return jsonobj;
  }
  attrobj["id"] = obj["id"];
	if(obj["nodeName"] == "CANVAS")
    {
    	/** @todo Context acquire from WebGL, and distinguish them */
    	/*
    	var data = new Object();
    	var imagedata =  obj.getContext("2d").getImageData(0,0,obj["width"],obj["height"]);
    	data["height"] = imagedata["height"];
    	data["width"] = imagedata["width"];

    	data["data"] = new Object(imagedata.data);
  
    	for(i = 0; i< imagedata.data.length; i++)
    		if (imagedata.data[i] !== undefined) 
    			data["data"][i] = imagedata.data[i];
		*/
		var data = obj.toDataURL("image/png");
        attrobj["dataurl"] = data;
       
    }
    else if(obj["nodeName"] == "SOURCE")
    {
    	if( obj["media"] != "")
    	  attrobj["media"] = obj["media"];
    	  attrobj["src"] = obj["src"];
    	  attrobj["type"] = obj["type"];
    }
    else if(obj["nodeName"] == "VIDEO" || obj["nodeName"] == "AUDIO")
    {
    	  attrobj["autoplay"] = obj["autoplay"];
    	  attrobj["controls"] = obj["controls"];
    	  attrobj["loop"] = obj["loop"];
    	  attrobj["muted"] = obj["muted"];
    	  attrobj["preload"] = obj["preload"];
    	  if( obj["src"] != "")
    	  	attrobj["src"] = obj["src"];
    	  if( obj["poster"] != "")
    	  	attrobj["poster"] = obj["poster"];
    	  attrobj["currentTime"] = obj["currentTime"];
    	  attrobj["paused"] = obj["paused"];
    	  attrobj["width"] = obj["width"];
    	  attrobj["height"] = obj["height"];
    	  
    }
    else if(obj["nodeName"] == "IFRAME" && obj["src"].toString().toLowerCase().indexOf("youtu") >= 0)
	{
		//YOUTUBE: GET YOUTUBE VIDEO
		//Youtube API required
		//http://developers.google.com/youtube/iframe_api_reference
		var player = youtube_videos[obj["id"]];
		attrobj["muted"] = player.isMuted();
		attrobj["currentTime"] = player.getCurrentTime();
		attrobj["videoId"] = player.getVideoUrl();
		attrobj["state"] = player.getPlayerState();
		attrobj["src"] = obj["src"];
		// END YOUTUBE: GET YOUTUBE VIDEO
	}
   
      while(jsonobj[n] != null)
      	n++;
  jsonobj[n] = attrobj;
  n++;
  for (var j = 0; j<obj.childNodes.length; j++)
  {
    if(obj.childNodes[j].nodeType == 3 || obj.childNodes[j].nodeType == 8)
    	continue;
    getAttributesToObj( obj.childNodes[j], jsonobj, n);
  }

  return jsonobj;
}

/**
 * socket.io(server) method - receive command from sender and execute command
 * @method receiveCommand
 * @param{String} command - command {javascript function name)
 * @param{String} params - command parameters (json object format)
 */
server.on("receiveCommand", function (command, params) {
    $.globalEval(command + "(" + params + ");");
});
