/*
	message channel. a form of isolation of systems on client and server
	channel instance defines protocol of communication on message-level
*/
aPackage('nart.net.message.channel', () => {
	"use strict";
	
	var Channel = function(name, handlers){
		this.handlers = handlers;
		this.name = name;
	}

	Channel.prototype = {
		send: function(messageType, messageData){ this.client.send(this.name, messageType, messageData) },
		receive: function(d){
			
			var isServer = this.client.isServerSide()
			
			var handlers = isServer? this.handlers.server: this.handlers.client,
				oppositeHandlers = isServer? this.handlers.client: this.handlers.server;
			
			var error = '';
			if(!handlers[d.type]){
				if(oppositeHandlers[d.type]){
					error = 'Message of type "' + d.type + '" received on wrong side of channel "' + this.name + '".';
				} else {
					error = 'Unknown message type "' + d.type + '" on channel "' + this.name + '".';
				}
			} else {
				try {
					handlers[d.type].call(this, d.data)
				} catch (e){
					error = e
				}
			}
			
			if(error){
				d.processingError = error;
				this.client.unhandledMessageReceived.fire(d)
			}			
			
		},
		getBinded: function(client){
			var c = new Channel(this.name, this.handlers)
			c.client = client;
			return c;
		}
	}
	
	return Channel;

});