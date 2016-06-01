aPackage('nart.net.socket.server', () => {
	"use strict";
	
	var Event = aRequire('nart.util.event'),
		SocketServer = aRequire.node('ws').Server;
	
	var Server = function(port, clientWrapper){
		if(!(this instanceof Server)) return new Server(port, clientWrapper);
		
		this.connected = new Event()
		
		var server = new SocketServer({ port: port });
		
		server.on('connection', ws => {
			var client = clientWrapper(ws);
			this.connected.fire(client)
		});
	}
	
	return Server;
});