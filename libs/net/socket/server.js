aPackage('nart.net.socket.server', () => {
	"use strict";
	
	var Event = aRequire('nart.util.event'),
		SocketServer = aRequire.node('ws').Server;
	
	var Server = function(port, onClient, cb){
		if(!(this instanceof Server)) return new Server(port, onClient, cb);
		
		this.connected = new Event()
		
		var server = new SocketServer({ port: port }, () => cb && cb());
		
		server.on('connection', ws => this.connected.fire(onClient(ws)));
	}
	
	return Server;
});