/*
	обертка вокруг нодовского http.Server
	если на processRequest зарегистрируется более одного слушателя, то, скорее всего, случится несогласованное чтение/запись, и несогласованное закрытие потока
*/
aPackage('nart.net.http.server', () => {
	"use strict";

	var http = aRequire.node('http'),
		Event = aRequire('nart.util.event');

	var Server = function(port, host, maxConnections){
		if(!(this instanceof Server)) return new Server(port);
		this.port = port || 0; // 0 - special value for random port. see node http docs
		this.host = host || '127.0.0.1';
		this.maxConnections = maxConnections || 0x7ff;
		this.onRequest = new Event();
		this.processRequest = (req, res) => {
			this.onRequest.fire({request: req, response: res});
		}
	}
	
	Server.prototype = {
		start: function(after){
			var server = http.createServer(this.processRequest);
			
			this.server = server;
			
			server.listen(this.port, this.host, this.maxConnections, after || (() => {}));
		},
		withRequestBody: (req, callback) => {
			var allData = [];

			req.on('data', data => allData.push(data));
			req.on('end', () => callback(Buffer.concat(allData)));
		},
	};
	
	return Server;

});