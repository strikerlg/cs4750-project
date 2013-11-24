var express = require('express');
var passport = require('passport');

var app = express();

// Route files
var organization = require('./routes/organization');
var tournament = require('./routes/tournament');
var Event = require('./routes/event'); // Lowercase event is a keyword
var account = require('./routes/account');

// MIME Types
express.static.mime.define({'text/javascript': ['js']});

// Compression
app.use(express.compress());

// Parser
app.use(express.bodyParser());

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Static Server
app.use('/js', express.static(__dirname + '/app/js'));
app.use('/partials', express.static(__dirname + '/app/partials'));
app.use('/assets', express.static(__dirname + '/app/assets'));
app.use('/css', express.static(__dirname + '/app/css'));

// Tournament Routes
app.get('/tournament/levels', tournament.levels);
app.post('/tournament/create', tournament.create);
app.post('/tournament/update', tournament.update);

// Organization Routes
app.post('/organization/create', organization.create);
app.post('/organization/update', organization.update);

// Event Routes
app.post('/event/create', Event.createEvent);

// Account Routes
app.post('/account/create', account.create);
app.post('/account/update', account.update);
app.post('/account/login', account.login);
app.get('/account/current', account.current);

// All other routes
app.all('/*', function(req, res) {
	console.log("GET", req.path);
	res.sendfile('./app/index.html');
});

app.listen(8080);
console.log('Listening on port 8080');
