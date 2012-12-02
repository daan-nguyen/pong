var port = 8080,
	basepath = './html';

var fs = require('fs'),
	url = require('url');

// setup servers
var express = require('express'),
    app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);
server.listen(8080);

// file serving
app.get('/', function(req, res) {
	res.sendfile(basepath + '/index.html');
});

app.get('/*', function(req, res) {
	var file = basepath + url.parse(req.url, true).pathname;

	fs.exists(file, function(exists) {
		if (exists) {
			res.sendfile(file);
		} else {
			res.statusCode = 404;
			res.end('File not found.')
		}
	});
});