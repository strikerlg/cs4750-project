var express = require('express');
var app = express();

app.use(express.compress());
app.use(express.static(__dirname + '/app'));

app.listen(8080);
console.log('Listening on port 8080');
