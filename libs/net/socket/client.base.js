aPackage('nart.net.socket.client.base', () => {
	"use strict";
	
	var Event = aRequire('nart.util.event');
	
	var ClientBase = function(socket){
		if(!(this instanceof ClientBase)) return new ClientBase(socket)
			
		this.socket = socket
		this.messageReceived = new Event()
		this.messageSendFailed = new Event()
	}
	
	ClientBase.prototype = {
		send: function(data){ 
			if(this.socket.readyState !== this.socket.OPEN) return false;
			try {
				this.socket.send(JSON.stringify(data))
				return true;
			} catch (e){
				this.messageSendFailed.fire({message: data, error: e})
				return false;
			}
		},
		disconnect: function(){
			this.socket.close() // server-side: maybe we should not? 
			this.messageReceived.stop() 
		}
	};
	
	
	return ClientBase;
	
});