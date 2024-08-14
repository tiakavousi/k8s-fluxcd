let color = process.env.COLOR_BACKGROUND || 'white';
const port = process.env.COLOR_PORT || 8080;
const fqdn = process.env.HOSTNAME || 'localhost';
const http = require('http');

http.createServer(function (request, response) {

    if (request.url === '/red') {
        color = "red"
        console.log('Change color to:', color);
    }
    if (request.url === '/white') {
        color = "white"
        console.log('Change color to:', color);
    }

    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write('<html>' +
        '    <head>' +
        '        <title>color ' + color + '</title>' +
        '        <style type="text/css">' +
        '            body {background-color:  ' + color + '}' +
        '        </style>' +
        '    </head>' +
        '    <body>' +
        '        <h1>' + color + '</h1>' +
        '        <h2>Running on ' + fqdn + '</h2>' +
        '        <h2><a href="red">red</a></h2>' +
        '        <h2><a href="white">white</a></h2>' +
        '    <body>' +
        '</html>');
    response.end();

}).listen(parseInt(port, 10));

console.log("HTTP server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
