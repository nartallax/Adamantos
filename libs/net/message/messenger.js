/*
Messenger - wrapper around some client that sets up by-message communication, channels etc
don't makes any assumptions about underlying protocol
requires for client to have methods send(object) and disconnect(), and also have event (property) messageReceived
*/
aPackage('nart.net.message.messenger', () => {
	"use strict";

	var Event = aRequire('nart.util.event'),
		HeartbeatChannel = aRequire('nart.net.message.channel.heartbeat')

	var Messenger = function(client){
		if(!(this instanceof Messenger)) return new Messenger(client)
	
		this.client = client;
		this.channels = {};
		this.latency = 0;
		
		client.messageReceived.listen(d => {
			d = d.data;
			
			var error = '';
			if(!d.channel){
				error = 'Message contains no channel name'
			} else if(!this.channels[d.channel]){
				error = 'Unknown channel name: "' + d.channel + '"';
			} else {
				this.channels[d.channel].receive(d)
			}
			
			if(error){
				d.processingError = error;
				this.unhandledMessageReceived.fire(d)
			}
		})
		
		this.unhandledMessageReceived = new Event();
		this.disconnected = new Event();
		
		this.defineChannel(HeartbeatChannel);
	}
	
	Messenger.prototype = {
		defineChannel: function(messageChannel){
			return this.channels[messageChannel.name] = messageChannel.getBinded(this);
		},
		send: function(channelName, messageType, messageData){ return this.client.send({channel: channelName, type: messageType, data: messageData}) },
		initializeHeartbeat: function(rate){
			var heartbeatChannel = this.channels.heartbeat;
			
			var scheduleSendHeartbeat = () => setTimeout(() => {
				heartbeatChannel.send('request', {sendTime: Date.now()})
			}, rate);
				
			this.expectHeartbeat(rate);
				
			(heartbeatChannel.scheduleSendHeartbeat = scheduleSendHeartbeat)()
		},
		expectHeartbeat: function(rate){
			var stoppedHandle = null;
				
			var refreshHeartbeat = () => {
				stoppedHandle !== null && clearTimeout(stoppedHandle)
				stoppedHandle = setTimeout(() => {
					this.client.disconnect();
					this.disconnected.fire()
				}, rate * 2)
			};
			
			(this.channels.heartbeat.refreshHeartbeat = refreshHeartbeat)();
		},
		
		// TODO: think of something more robust
		isServerSide: function(){ return typeof(module) !== 'undefined' }
	}
	
	return Messenger;

});