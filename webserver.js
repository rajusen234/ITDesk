/*
 * ITDesk Web Server - serves index.html via HTTP
 * Fixes the file:// CORS block issue
 * Port: 8888
 */
var http = require('http');
var fs   = require('fs');
var path = require('path');

var DIR  = __dirname;
var PORT = 8888;

http.createServer(function(req, res) {
    var filePath = (req.url === '/' || req.url === '') ? 'index.html' : req.url.replace(/^\//, '');
    var fullPath = path.join(DIR, filePath);

    fs.readFile(fullPath, function(err, data) {
        if (err) {
            res.writeHead(404);
            res.end('Not found: ' + filePath);
            return;
        }
        var ext = path.extname(filePath).toLowerCase();
        var mime = {
            '.html': 'text/html',
            '.js':   'application/javascript',
            '.css':  'text/css',
            '.json': 'application/json'
        }[ext] || 'text/plain';

        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
}).listen(PORT, function() {
    console.log('ITDesk Web Server running on port ' + PORT);
});
