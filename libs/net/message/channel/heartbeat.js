/*
special channel that is needed for messenger to detect disconnects
not intended to be used directly; use messenger methods instead
*/
aPackage('nart.net.message.channel.heartbeat', () => {
	"use strict";
	
	var Channel = aRequire('nart.net.message.channel')
	
	var HeartbeatChannel = new Channel('heartbeat', { 
		client: {
			request: function(d){ 
				this.refreshHeartbeat && this.refreshHeartbeat();
				this.send('responce', {sendTime: d.sendTime})
			},
		},
		server: {
			responce: function(d){
				this.refreshHeartbeat && this.refreshHeartbeat();
				this.scheduleSendHeartbeat && this.scheduleSendHeartbeat(); 
				this.latency = (Date.now() - d.sendTime) }
		}
	});
	
	return HeartbeatChannel;

});