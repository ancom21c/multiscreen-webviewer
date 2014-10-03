/** @module uxFramework-server 
 *  @author Sanghong An, ancom21c@kaist.ac.kr; Hyeontaek Oh, hyeontaek@kaist.ac.kr
 *  @version 0.6.1
 *
 *  @requires socket.io:0.9.14
    @requires socket.io-client:0.9.11
 *  @requires connect:2.7.4
 *  @requires cookie:0.0.6
 *  @requires express:3.1.0
 *  @requires connect-redis
 */
 
/** 
 * An array of client IDs
 * @constant  
 */ 

var parent = module.parent.parent.exports 
  , app = parent.app
  , server = parent.server
  , express = require('express')
  , client = parent.client
  , sessionStore = parent.sessionStore
  , io = require('socket.io')
  , parseCookies = require('connect').utils.parseSignedCookies
  , cookie = require('cookie')
  , secret = parent.secret
  //, config = require('./config.json')
  , fs = require('fs')
  , port = parent.port
  , connect = require('connect')
  , sessionKey = parent.sessionKey
  , serviceSessionKey = parent.serviceSessionKey;


var sio = io.listen(server);
var Session = connect.middleware.session.Session;
var socketMap = {};
var groupInfo = new Object();
// CANVAS
var chat = sio.of('/chat'),
    canvas = sio.of('/canvas')
;
	
sio.set('authorization', function (data, accept) {
	  	  	
	if (!data.headers.cookie)
		return accept("No cookie transmitted", false);

	var cookies = parseCookies(cookie.parse(data.headers.cookie), secret)
		, sid = cookies[sessionKey];
	var ssid = cookie.parse(data.headers.cookie)[serviceSessionKey];

	sessionStore.load(sid, function(err, session) {
	    if(err || !session) {
		    return accept('Error retrieving session!', false);
		}
			  
		data.sessionID = sid;
		data.session = session;
		data.session.sessionID = sid;
		data.session.serviceSID = ssid;
		return accept(null, true);		 
	});
});
	
sio.set('log level', 1);

sio.configure(function() {
  sio.set('store', new io.RedisStore({client: client}));
  sio.enable('browser client minification');
  sio.enable('browser client gzip');
}); 	

sio.sockets.on('connection', function (socket) {
	var hs = socket.handshake
	  , userKey = hs.session.userID
	  , group = hs.session.group
	  , sessionID = hs.sessionID;
	var serviceSID;

    client.set('sockets:for:' + userKey + ':sid:' + sessionID, socket.id, function(err, socketAdded) {
	    if(socketAdded) {
	
		  client.sadd('uxframework:sessions', sessionID, function(err, r){});
	      client.sadd('socketio:sockets', socket.id, function(err, r){});
	
	      client.sadd('uxframework:users:of:group:' + group , userKey, function(err, userAdded) {
	        if(userAdded) {
	        }
	      });
	    }
	});    

	/** 
	     * socket.io(server) method - Checking Session
	     * @method sessionCheck
 		 */
	socket.on('sessionCheck', function () {
		socket.emit('sessionCheck', userKey, sessionID);
	});
		
		
		
	socket.on('sessionHandshake', function( sid) {


		client.keys('sockets:for:*:'+sessionID, function(err, sockets) {
			client.del(sockets);
	
		});

		serviceSID = sid;
		hs.session['serviceSID'] = serviceSID;
 
        sessionStore.load(sid, function(err, session) {
      	  if(err || !session) {
       		console.log("service session loading error : " + err);
      	  }
		    if (session["userID"])    	
                userKey = hs.session.userID = session.userID;
            else
                userKey = hs.session.userID;
                
            if (session.group)
                group = hs.session.group = session.group;
            else
                group = hs.session.group;

			hs.session.sessionID = session['sessionID'] = sessionID;
			session.save();
			hs.session.save();

			client.set('sockets:for:' + userKey + ':sid:' + sessionID, socket.id, function(err, socketAdded) {
					if(socketAdded) {
		
						client.sadd('uxframework:users:of:group:' + group , userKey, function(err, userAdded) {
							if(userAdded) {
							}
						});
					}
			}); 
			
			for ( var key in session) {
				if( key !== "cookie" && (typeof session[key]) === "string" ) {
					client.sadd("uxframework:" + key + ":" + session[key], sessionID, function(err, r){})
				}
			}

			socket.emit('sessionCheck', userKey, sessionID);
			socket.emit('sessionInit');
        });
	});

 	socket.on('userList', function (callback) {
 		sessionValueList('userID', callback);
 	});
 
 
    /** 
	     * socket.io(server) method - Show device sessions.
	     * @method deviceList
 		 */ 	
	socket.on('deviceList', function (callback) {
		sessionListBy('userID', userKey, callback);
	});

	/** 
		     * socket.io(server) method - Clear session data when session disconnected.
		     * @method disconnect
	 		 */ 	
	socket.on('disconnect', function (){
		console.log('A socket with sessionID '+ hs.sessionID +' disconnected.');
        
        var hsk = sio.sockets.manager.handshaken;
        var cnt = 0;
        for (var s in hsk) {
            if(hsk[s].sessionID == hs.sessionID)
                cnt = cnt + 1;
            //console.log(hsk[s].sessionID);
        }
        //console.log(cnt);
        
        if (cnt < 2){        
            // leave canvas room
            if (socket.room) {
                socket.leave(socket.room);
                delete socket.room;
            }
            
            client.del('sockets:for:' + userKey + ':sid:' + sessionID, function(err, removed) {
              if(removed) {
                client.srem('socketio:sockets', socket.id, function(err, r){});
                client.srem('sessions', sessionID, function(err, r){});
                /*
                client.keys('uxframework:*', function(err, keys) {
                    if(keys.length) {
                      for( k in keys) {
        
                        client.srem( keys[k], sessionID, function(err, removed){} );
                      }
                    }
                    console.log('Deletion of session reference for each key-value >> ', err || "Done!");
                  });
                
                client.srem('uxframework:users:of:group:' + group, userKey, function(err, removed) {
                  if (removed) {
        
                  }
                });
                */
              }
            });
            
        }
	});

/** 
	     * socket.io(server) method - Broadcast the object to whole users.
	     * @method broadcastObject
	     * @param{String} obj - HTML object.
	     * @param{Object} ele - HTML element tree object.
 		 */ 	
	socket.on('broadcastObject', function (obj, ele) {
	    socket.broadcast.emit('receiveObject', userKey, obj, ele);
	});


    /** 
	     * socket.io(server) method - send the object to target user.
	     * @method sendObject
	     * @param{String} receiver - receiver's session ID
	     * @param{String} obj - HTML object.
	     * @param{Object} ele - HTML element tree object.
 		 */ 	
	socket.on('sendObject', function (receiver, obj, ele) {
		sendObject(receiver, obj, ele, 'sockets:for:' ,'*');
	});

	/** 
	     * socket.io(server) method - send the object to target user, with receiver's event listener.
	     * @method sendObjectWithFunc
	     * @param{String} receiver - receiver's session ID
	     * @param{String} obj - HTML object.
	     * @param{Object} ele - HTML element tree object.
	     * @param{String} func - Javascript function string.
 		 */ 	
    socket.on('sendObjectWithFunc', function (receiver, obj, ele, func) {
		sendObjectWithFunc(receiver, obj, ele, func, 'sockets:for:' ,'*');
    });
    
   	/** 
	     * socket.io(server) method - send the object to target device.
	     * @method sendObjectToDevice
	     * @param{String} receiver - receiver's session ID
	     * @param{String} obj - HTML object.
	     * @param{Object} ele - HTML element tree object.
 		 */ 	
	socket.on('sendObjectToDevice', function (receiver, obj, ele) {
	
		sendObject(receiver, obj, ele,  'sockets:for:*:', '');
	});
// END 130502: Send Object to Device

	/** 
	     * socket.io(server) method - send the object to target device.
	     * @method sendObjectToDevice
	     * @param{String} receiver - receiver's session ID
	     * @param{String} obj - HTML object.
	     * @param{Object} ele - HTML element tree object.
	     * @param{String} func - Javascript function string.
 		 */ 	
	socket.on('sendObjectToDeviceWithFunc', function(receiver, obj, ele, func){
		sendObjectWithFunc(receiver, obj, ele, func, 'sockets:for:*:', '');
	});

	/**
	 * socket.io(server) method - list all session value of given key
	 * @method sessionValueList
	 * @param{String} key - option name
	 * @param{String} callback - callback function name what you want to get data
	 */
	socket.on('sessionValueList', function(key, callback) {
	
	    client.keys("uxframework:" + key + ":*", function (err, sessionKeys) {
	        var array = Array();
	        for (var sk in sessionKeys) {
	            array.push(sessionKeys[sk].substring("uxframework:".length + key.length + 1)); 
	        }
	        sendToClient(0, array, callback);
	    });
	});


	/**
	 * socket.io(server) method - set optional key-value pair to session
	 * @method setSessionOption
	 * @param{String} key - option name
	 * @param{String} value - option value
     * @param{String} callback - callback function name what you want to get data
	 */
	socket.on('setSessionOption', function(key, value, callback){
		setSessionOptionOf (sessionID, key, value, callback);
	});

	/**
	 * socket.io(server) method - delete its session option
	 * @method removeSessionOption
	 * @param{String} key - option name
     * @param{String} callback - callback function name what you want to get data
	 */
	socket.on('removeSessionOption', function(key, callback) {
		removeSessionOptionOf (sessionID, key, callback);
	});
        

	socket.on("setSessionOptionOf", function(sID, key, value, callback){ 
		setSessionOptionOf(sID, key, value); 
	});


	socket.on('removeSessionOptionOf', function(sID, key, callback){
		removeSessionOptionOf (sID, key); 
	});


	socket.on('sessionInfo', function(sID, callback){
		sessionInfo(sID, callback);
	});

	/**
	 * socket.io(server) method - Send concurrent user lists to whole users.
	 * @method sessionList
	 * @param{String} callback - callback function name what you want to get data
	 */
	socket.on('sessionList', function (callback) {
	    var array = Array();
	    var json_session = "";
	    var sema;
	
	    client.smembers('uxframework:sessions', function(err, sessions){
	
	        sema = sessions.length;
	        if(sessions.length){
	
	            for( var s in sessions ) {
	                sessionStore.load( sessions[s], function(err, session) {
	                    var o = session;
	                    delete o.cookie;
	
	                    array.push(o);
	                    
	                    sema = sema - 1;
	                    sendToClient(sema, array, callback);
	                });
	            }
	        }
	    });
	});


	socket.on('sessionListBy', function(key, value, callback){
		sessionListBy(key, value, callback);
	});


	/**
	 * socket.io(server) method - set group option to its session
	 * @method setGroup
	 * @param{String} gID - group name
     * @param{String} callback - callback function name what you want to get data
	 */
	socket.on('setGroup',  function(gID, callback){
		setGroupOf(sessionID, gID, callback);
	});

	/**
	 * socket.io(server) method - remove group option to its session
	 * @method removeGroup
     * @param{String} callback - callback function name what you want to get data
	 */
	socket.on('removeGroup', function(callback){
		removeGroupOf(sessionID, callback); 
	});

	/**
	 * socket.io(server) method - list of all group entities
	 * @method groupList
	 * @param{String} callback - callback function name that you want to get data
	 */
	socket.on('groupList', function(callback) {
	    groupList(callback);
	});


	socket.on('userListOfGroup', function(gID, callback){
		userListOfGroup(gID, callback);
	});

	socket.on('removeGroupOf', function(sID, callback){
		removeGroupOf(sID, callback); 
	});

	socket.on('setGroupOf', function(sID, gID, callback){
		setGroupOf(sID, gID, callback);
	});
// END 130614: Group function

// Command Pattern


	socket.on("sendCommand", function(command, params, sID){
		sendMsg(command, params, sID); 
	});

	/**
	 * socket.io(server) method - send command to all sessions except sender
	 * @method sendCommand
	 * @param{String} command - command {javascript function name)
	 * @param{String} params - command parameters (json object format)
	 */
	socket.on("sendCommandAll", function(command, params){
	    socket.broadcast.emit("receiveCommand", command, params);
	});


    socket.on("sendCommandGroup", function(command, params, gid){
    	sendMsgToGroup(command, params, gid);    
    // END: Command Pattern
	});
 	



	function sendToClient(sema, value, callback) {
	    if (sema > 0) return;
	    var json_string = JSON.stringify(value);
	    socket.emit(callback, json_string);
	}
	
	function sendToAllClients(sema, value, callback) {
	    if (sema > 0) return;
	    var json_string = JSON.stringify(value);
	    socket.broadcast.emit(callback, json_string);
	}
	
	
	/**
	 * socket.io(server) method - send command to specific group
	 * @method sendCommand
	 * @param{String} command - command {javascript function name)
	 * @param{String} params - command parameters (json object format)
	 * @param{String} gID - target sessionID
	 */
	function sendMsgToGroup( command, params, gid) {
		var sockets = sio.sockets;
		client.smembers('uxframework:users:of:group:' + gid, function(err, users) {
		    for (var i in users) {
		    	client.keys( 'sockets:for:' + users[i] + '*', function(err, socketKeys){
		        	for (var sk in socketKeys) {
		        		client.get( socketKeys[sk], function(err, s){
		        			sockets.socket(s).emit("receiveCommand", command, params);
		        		});
		      		}
		    	});
		    }
		});
	}
	
	/**
	 * socket.io(server) method - send command to specific session
	 * @method sendCommand
	 * @param{String} command - command {javascript function name)
	 * @param{String} params - command parameters (json object format)
	 * @param{String} sID - target sessionID
	 */
	function sendMsg( command, params, sID) {
		var sockets = sio.sockets;
		client.keys( 'sockets:for:*:sid:' + sID, function(err, socketKeys){
			for (var sk in socketKeys) {
				client.get( socketKeys[sk], function(err, s) {
					sockets.socket(s).emit("receiveCommand", command, params);	
				});
			}
		});
	} 
    
	function groupList (callback) {
	    client.keys('uxframework:group:*', function(err, array){ 
	        sendToClient(0, array, callback);
	    });
    }
    
	/**
	 * socket.io(server) method - set group option of specific session
	 * @method setGroupOf
	 * @param{String} sID - target sessionID
	 * @param{String} gID - group name
	 */
	function setGroupOf(sID, gID, callback) {
	    sessionStore.load(sID, function(err, session) {
	    	
	  		console.log("setgroupof : " + sID + " " + gID);
	  		
			if(err || !session) {
				
	  			console.log("set group error");
				return;
			}
	  		
		    // del sync
		    client.smembers("uxframework:userID:" + session.userID, function(err, sIDs) {
		        if (sIDs.length) {
		            for ( var i in sIDs)
						
						client.srem('uxframework:users:of:group:' + gID, session.userID, function(err, isAdded){
                        });
						client.srem('uxframework:group:' + session.group, sIDs[i], function(err, isGroupEmpty) {
						});
										
		        }
		    });


			client.keys( "uxframework:users:of:group:*", function(err, groupKeys){
			console.log('groupkey : ' );
				for (var i in groupKeys){
					if(client.srem( groupKeys[i], session.userID, function(err, r){
			
					}) > 0) break;
				}
				client.sadd('uxframework:users:of:group:' + gID, session.userID, function(err, isAdded){
				
				});
			});

								// sync
			client.smembers( "uxframework:userID:" + session.userID , function(err, sessions) {
                 var sema = sessions.length;
                 console.log(sema);
				 if(sessions.length){
						for( var s in sessions){
							 sessionStore.load( sessions[s], function( err, ss) {
								ss.group = gID;
								ss.save();
								client.sadd('uxframework:group:' + gID, ss.sessionID, function(err, isAdded){
                                    if (--sema == 0)
                                        groupList(callback);
                                });
								
								//socket.emit('groupRefresh');
							});
						}
				}
                else {
                    groupList(callback);
                }
			});

			sessionStore.load(session.serviceSID, function(err, ss) {
				if(err || !ss) {
					console.log("set session option error 2");
					return;
				 }
	  
				var or = ss.group;
				ss.group = gID;
				ss.save(); 
			});


		});
	}
	
	/**
	 * socket.io(server) method - remove group option of specific session
	 * @method removeGroupOf
	 * @param{String} sID - target sessionID
	 */ 
	function removeGroupOf(sID, callback) {
		sessionStore.load(sID, function(err, session) {
			console.log("rem groupof : " + sID + " ");
			if(err || !session) {
				console.log("rem groupof error on " + sID + " ");
				return;
			}

			var o = session.group;
			client.smembers("uxframework:userID:" + session.userID, function(err, sIDs) {
                var sema = sIDs.length;
			    if (sIDs.length) {
			        for ( var i in sIDs)
			        	client.srem('uxframework:users:of:group:' + o, sIDs[i], function(err, isAdded){
                        });
			            client.srem('uxframework:group:' + o, sIDs[i], function(err, isGroupEmpty) {
                            if (--sema == 0)
                                groupList(callback);
			            	//socket.emit('groupRefresh');
			            });
			    }
			});
		    
			            // sync
		    client.smembers( "uxframework:userID:" + session.userID , function(err, sessions) {
		        if(sessions.length){
		            for( var s in sessions){
		                sessionStore.load( sessions[s], function( err, ss) {
		                    delete ss.group;
		                    ss.save();
		                });
		            }
		        }
		    });
            
			delete session.group;
			session.save();
			
			sessionStore.load(session.serviceSID, function(err, ss) {
			      if(err || !ss) {
			        return;
			      }
				  
				  var or = ss.group;
			      delete ss.group;
			      ss.save(); 
			  });
			  
			client.srem('uxframework:users:of:group:' + o, session.userID, function(err, r){}) ;
			 
			return;
		});
	}
	
	/**
	 * socket.io(server) method - list of users in the specific group
	 * @method userListOfGroup
	 * @param{String} gID - group ID
	 * @param{String} callback - callback function name that you want to get data
	 */
	function userListOfGroup(gID, callback) {
		var array = Array();
		var sema = 0;
				
		client.smembers( 'uxframework:group:' + gID, function(err, sessions){
		    if (sessions.length) {
		        sema = sessions.length;
		        for (var s in sessions) {
		        	
		            sessionStore.load( sessions[s], function(err, session) {
						if(err || !session){
							console.log('session err from ' + sessions[s]);
							return;
						}

		                var ss = session;
		                	                		                
		                delete ss.cookie;
		                
		                array.push(ss);
		                
		                sema = sema - 1;
		                sendToClient(sema, array, callback);
		            });
		        }    
		    } else {
		    	sendToClient(sema, array, callback);
		    }
		});
	}
	
	/**
	 * socket.io(server) method - Send spcific concurrent user lists to whole users (by option value)
	 * @method sessionListByOf
	 * @param{String} sid - target session ID
	 * @param{String} key - option name
	 * @param{String} value - option value
	 * @param{String} callback - callback function name that you want to get data
	 */
	function sessionListOfBy(sid ,key, value, callback) {
	    var array = Array();
	    var sema = 0;
	
	    client.smembers( 'uxframework:' + key + ':' + value, function(err, sessions){
	        if (sessions.length) {
	            sema = sessions.length;
	            for (var s in sessions) {
	                sessionStore.load( sessions[s], function(err, session) {
	                    var ts = session;
	                    
	                    if(ts.sessionID == sid){
		                    delete ts.cookie;
		                    array.push(ts);
		                }    
	                    sema = sema - 1;
	                    sendToClient(sema, array, callback);
		                
	                });
	            }
	        } else {
		    	sendToClient(sema, array, callback);
		    }
	    });
	}
	
	
	/**
	 * socket.io(server) method - Send spcific concurrent user lists to whole users (by option value)
	 * @method sessionListBy
	 * @param{String} key - option name
	 * @param{String} value - option value
	 * @param{String} callback - callback function name that you want to get data
	 */
	function sessionListBy(key, value, callback) {
	    var array = Array();
	    var sema = 0;
	
	    client.smembers( 'uxframework:' + key + ':' + value, function(err, sessions){
	        if (sessions.length) {
	            sema = sessions.length;
	            for (var s in sessions) {
	                sessionStore.load( sessions[s], function(err, session) {
	                    var s = session;
	                    delete s.cookie;
	                    
	                    array.push(s);
	                    
	                    sema = sema - 1;
	                    sendToClient(sema, array, callback);
	                });
	            }
	        } else {
		    	sendToClient(sema, array, callback);
		    }
	    });
	}
	
	/**
	 * socket.io(server) method - session information by give sessionID
	 * @method sessionInfo
	 * @param{String} sID - sessionID
	 * @param{String} callback - callback function name what you want to get data
	 */
	function sessionInfo(sID, callback) {
	    sessionStore.load(sID, function(err, session) {
	        var s = session;
	        delete s.cookie;
	        sendToClient(0, s, callback);
	    });
	}
	
	/**
	 * socket.io(server) method - remove option of specific sessionID
	 * @method removeSessionOptionOf
	 * @param{String} sID - target sessionID
	 * @param{String} key - option name
	 */
	function removeSessionOptionOf(sID, key, callback) {
	
	    sessionStore.load(sID, function(err, session) {
	      if(err || !session) {
	        return;
	      }
		  
		  var o = session[key];
	      delete session[key];
	      session.save();
	      
	      sessionStore.load(session.serviceSID, function(err, ss) {
		      if(err || !ss) {
		        return;
		      }
			  
			  var or = ss[key];
		      delete ss[key];
		      ss.save(); 
              
              sessionInfo(sID, callback);
		  });
	      
	      
	      client.srem('uxframework:' +  key + ':' + o, sID, function(err, r){
            
          });
	
	    });
	}
	
	/**
	 * socket.io(server) method - change session option value of specific user
	 * @method changeSessionOptionOf
	 * @param{String} sID - target sessionID
	 * @param{String} key - option name
	 * @param{String} value - option value
	 */
	function setSessionOptionOf(sID, key, value, callback) {          
	    sessionStore.load(sID, function(err, session) {
	      if(err || !session) {
	      	console.log("set session option error 1");
	        return;
	      }
		  
		  console.log("session option - " + key + " - " + value);
		  
		  var o = session[key];
	      session[key] = value;
	      session.save();
	      
	      sessionStore.load(session.serviceSID, function(err, ss) {
		      if(err || !ss) {
		      	console.log("set session option error 2");
		        return;
		      }
			  
			  var or = ss[key];
		      ss[key] = value;
		      ss.save();
              sessionInfo(sID, callback);
		  });
	      
	      client.sadd('uxframework:' +  key + ':' + value, sID, function(err, isAdded){});
	     
	      return;
	      
	    });
	}
	
	/** 
		     * socket.io(server) method - send the object to target user, with receiver's event listener.
		     * @method sendObjectWithFunc
		     * @param{String} receiver - receiver's session ID
		     * @param{String} obj - HTML object.
		     * @param{Object} ele - HTML element tree object.
		     * @param{String} func - Javascript function string.
		     * @param{String} query1 - Query string for searching receiver.
		     * @param{String} query2 - Query string for searching receiver.
	 		 */ 	
	function sendObjectWithFunc(receiver, obj, ele, func, query1, query2) {
		var sockets = sio.sockets;
		client.keys( query1 +  receiver + query2 , function(err, socketKeys){
	    	for (var sk in socketKeys) {
	    		client.get( socketKeys[sk], function(err, s){
	        		sockets.socket(s).emit('receiveObjectWithFunc', userKey, obj, ele, func);	
	    		} );
	    	}
		});
	}
	
	/** 
		     * socket.io(server) method - send the object to target user.
		     * @method sendObject
		     * @param{String} receiver - receiver's session ID
		     * @param{String} obj - HTML object.
		     * @param{Object} ele - HTML element tree object.
		     * @param{String} query1 - Query string for searching receiver.
		     * @param{String} query2 - Query string for searching receiver.
	 		 */ 
	function sendObject(receiver, obj, ele, query1, query2) {
		var sockets = sio.sockets;
		client.keys( query1 +  receiver + query2 , function(err, socketKeys){
	    	for (var sk in socketKeys) {
	    		client.get( socketKeys[sk], function(err, s){
	        		sockets.socket(s).emit('receiveObject', userKey, obj, ele);	
	    		} );
	    	}
		});
	}
	
	function sessionValueList(key, callback) {
	    client.keys("uxframework:" + key + ":*", function (err, sessionKeys) {
	        var array = Array();
	        for (var sk in sessionKeys) {
	            array.push(sessionKeys[sk].substring("uxframework:".length + key.length + 1)); 
	        }
	        sendToClient(0, array, callback);
	    });
	}

    // 130707: CANVAS
    socket.on('enterCanvasRoom', function(roomID) {
        sio.sockets.in(roomID).emit('reqInitCanvasData');
        socket.join(roomID);
        socket.room = roomID;
    });
    socket.on('leaveCanvasRoom', function() {
        socket.leave(socket.room);
        delete socket.room;
    });
    /*
    socket.on('canvasPenInit', function(penData) {
        sio.sockets.in(socket.room).emit('drawPen', penData);
    });
    */
    socket.on('canvasInit', function(canvasData) {
        sio.sockets.in(socket.room).emit('drawInitCanvas', canvasData);
    });
    socket.on('draw', function (command) {
        if(socket.room)
            sio.sockets.in(socket.room).emit('draw', command);
    });

    socket.on('updateCursor', function(position) {
        if(socket.room)
            socket.broadcast.to(socket.room).emit('updateCursor', {
                name: userKey,
                position:position
            });
    });
    
    // Group information
    socket.on("setGroupInfo", function (gID, key, value, callback) {
        // set group
        if (!(gID in groupInfo)) {
            groupInfo[gID] = new Object();
            groupInfo[gID].groupID = gID;
        }
        groupInfo[gID][key] = value;
        if (callback) 
            sendToClient(0, groupInfo[gID], callback);
    });
    
    socket.on("removeGroupInfo", function (gID, key, callback) {
        if (gID in groupInfo) {
            delete groupInfo[gID][key];
        }
        if (Object.keys(groupInfo[gID]).length == 0) 
            delete groupInfo[gID];
        if (callback)
            sendToClient(0, groupInfo[gID], callback);
    });
    
    socket.on("removeGroupInfoAll", function (gID, callback) {
        if (gID in groupInfo)
            delete groupInfo[gID];
        if (callback)
            sentToClient(0, groupInfo, callback);
    });
    //socket.on 
    socket.on("groupInfoList", function(gID, callback) {
        sendToClient(0, groupInfo[gID], callback);
    });
    
    socket.on("groupInfoListAll", function(callback){
        sendToClient(0, groupInfo, callback);
    });
});

