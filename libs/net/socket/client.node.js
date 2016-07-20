aPackage('nart.net.socket.client.node', () => {
	"use strict";
	
	var clutil = aRequire('nart.util.class'),
		ClientBase = aRequire('nart.net.socket.client.base');
	
	var Client = function(socket){
		if(!(this instanceof Client)) return new Client(socket)
		ClientBase.call(this, socket)

		this.ip = this.socket.upgradeReq.connection.remoteAddress;
	
		socket.on('message', message => this.messageReceived.fire(message));
	}

	Client.prototype = clutil.proto(ClientBase, {
		getIp: function(){ return this.id }
	});
	
	return Client;
});