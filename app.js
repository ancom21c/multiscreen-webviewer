
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path'),
	redis = require('redis'),
	session = require('express-session'),
	cookieParser = require('cookie-parser'),
	cluster = require('cluster'),
	RedisStore = require('connect-redis')(session);

var numCPUs = require('os').cpus().length;

var _ = require('underscore');


var	webdriver = require('./webdriver'),
	socketCtrl = require('./socketCtrl'),
	renderCtrl = require('./renderCtrl');

var	secret = exports.secret = 'kaistmnlab';

var app = exports.app = express();
var port = exports.port = +process.argv[2] || process.env.PORT || 6789; 
var server = http.createServer(app);
var io = require('socket.io');

process.env.PATH = process.env.PATH + ":bin:node_modules/.bin:/usr/local/bin:/opt/local/bin";

if (process.env.REDISTOGO_URL) {
  var rtg   = require('url').parse(process.env.REDISTOGO_URL);
  var client = exports.client  = redis.createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(':')[1]); // auth 1st part is username and 2nd is password separated by ":"
} else {
  var client = exports.client  = redis.createClient();
  var prefix = '';
}

var sessionStore = exports.sessionStore = new RedisStore({client: client, prefix: prefix});
var serviceSessionKey = exports.serviceSessionKey = "JSESSIONID";
var sessionKey = exports.sessionKey = "kaisquare";


// all environments
app.configure(function(){
	app.set('port', port);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());

	app.use(express.static(path.join(__dirname, 'public')));
	
	app.use(app.router);
	// development only
	if ('development' == app.get('env')) {
	  app.use(express.errorHandler());
	}
	

	// Handle Errors gracefully
	app.use(function(err, req, res, next) {
		if(!err) return next();
		console.log(err.stack);
		res.json({error: true});
	});
  
	app.use(express.cookieParser(secret));
	app.use(express.session({
    	key: sessionKey,
    	secret: secret,
    	store: sessionStore
	}));
	
	app.get('/', routes.index);
	app.get('/users', user.list);
});


server = exports.server = http.createServer(app).listen(app.get('port'), function() {
  console.log('Multiscreen-viewer started on port %d', app.get('port'));
});
var sessionManager =  require('./sessionManager');
var sio = module.exports.io = io.listen(server);

app.get('/goto', webdriver.gotourl);

socketCtrl.index(sio, sessionManager);
webdriver.init( renderCtrl, sessionManager, socketCtrl);

sio.sockets.on('connection', socketCtrl.connect);

process.on('exit',function(){
	webdriver.die();
});

