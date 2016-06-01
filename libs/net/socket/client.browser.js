aPackage('nart.net.socket.client.browser', () => {
	"use strict";

	var clutil = aRequire('nart.util.class'),
		ClientBase = aRequire('nart.net.socket.client.base');
	
	var Client = function(socket){
		if(!(this instanceof Client)) return new Client(socket)
		ClientBase.call(this, socket);
		
		this.socket.onmessage = e => this.messageReceived.fire(JSON.parse(e.data))
	}
	
	Client.prototype = clutil.proto(ClientBase);
	Client.connect = (url, cb) => {
		var socket = new WebSocket(url);
		socket.onopen = () => cb(new Client(socket))
	}
	
	return Client;

});