aPackage('nart.net.message.messenger.client', () => {
	"use strict";

	var Event = aRequire('nart.util.event'),
		ByteManip = aRequire('nart.util.byte.manipulator');

	var Messenger = function(client, isServerSide, unhandledMessagesBufferSize){
		if(!(this instanceof Messenger)) return new Messenger(client, isServerSide)
	
		this.isServerSide = isServerSide? true: false;
		this.client = client;
		this.unhandledMessagesBufferSize = unhandledMessagesBufferSize;
		
		this.channels = {};
		this.unhandledMessageBuffers = {};
		this.channelNameIdMapping = {};
		this.channelIdNameMapping = {};
		this.latencyToClient = null;
		this.latencyToServer = null;
		
		client.messageReceived.listen(d => {
			try {
				
			} catch(e){
				this.onError.fire({data: d.data, error: e})
			}
			/*
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
			*/
		})
		
		this.onError = new Event();
		this.onDisconnect = new Event();
	}
	
	var throwMessageDefinitionError = (isServerSide, messageName, channelName, reason) => {
		throw new Error(
			'Could not define ' + (isServerSide? 'server': 'client') + '-side message "' + messageName + '" in channel "' + channelName + '": ' + reason
		);
	}
	
	var throwHandlerDefinitionError = (handlerName, messageName, channelName, reason) => {
		throw new Error('Failed to define handler "' + handlerName + '" for message "' + messageName + '" on channel "' + channelName + '": ' + reason);
	}
	
	Messenger.prototype = {
		createIncorrectSideMessageHandler: function(channelName, messageName, priority, isServerSideExpected){
			return d => {
				var error = new Error('Could not handle message "' + messageName + '" in channel "' + channelName + '": message received on wrong side (expected: ' + (isServerSide? 'server': 'client') + '-side.');
				this.onError.fire({data: d, error: error});
			}
		},
		
		forceAddMessageHandler: function(channelName, messageName, handler, name, priority){
			priority = priority || 0;
			name = name || 'default';
			
			if(priority > 0xffffffff || priority < 0){
				throwHandlerDefinitionError(isServerSide, messageName, channelName, 'incorrect priority value: ' + priority);
			}
			
			var channel = this.channels[this.channelNameIdMapping[channelName]],
				isServerSide = messageName in channel.serverNameIdMapping,
				messageId = (isServerSide? channel.serverNameIdMapping: channel.clientNameIdMapping)[messageName],
				handlers = (isServerSide? channel.server: channel.client)[messageId];
			
			handlers.forEach(h => {
				if(h.priority === priority){
					throwHandlerDefinitionError(isServerSide, messageName, channelName, 'already have handler with priority ' + priority);
				}
				
				if(h.handlerName === handlerName){
					throwHandlerDefinitionError(isServerSide, messageName, channelName, 'already have handler with name "' + name + '"');
				}
			});
			handlers.push({priority: priority, handler: handler, name: name});
			handlers.sort((a, b) => a.priority > b.priority? 1: -1);
		},
		addMessageHandler: function(channelName, messageName, handler, name, priority){
			var channel = this.channels[this.channelNameIdMapping[channelName]];
				
			if(!channel){
				throwHandlerDefinitionError(name, messageName, channelName, 'no channel defined.');
			}
			
			var isServerSide = messageName in channel.serverNameIdMapping;
				
			if(!(messageName in channel.serverNameIdMapping) && !(messageName in channel.clientNameIdMapping)){
				throwHandlerDefinitionError(name, messageName, channelName, 'no message defined.');
			}
			
			if(isServerSide !== this.isServerSide){
				return; // should not define such handler; this message always will generate error on this side
			}
			
			this.forceAddMessageHandler(channelName, messageName, handler, name, priority);
		},
		
		defineMessage: function(channelName, messageName, handler, isServerSide){
			isServerSide = isServerSide? true: false;
			
			handler = isServerSide === this.isServerSide? 
				handler: 
				this.createIncorrectSideMessageHandler(channelName, messageName, isServerSide);
			
			var channel = this.channels[this.channelNameIdMapping[channelName]];
			if(!channel) throwMessageDefinitionError(isServerSide, messageName, channelName, 'channel not defined');
			
			var sideObj = isServerSide? channel.server: channel.client,
				sideMapping = isServerSide? channel.serverNameIdMapping: channel.clientNameIdMapping,
				reverseSideMappint = isServerSide? channel.serverIdNameMapping: channel.clientIdNameMapping,
				messageHandlers;
				
			if(messageName in sideMapping){
				throwMessageDefinitionError(isServerSide, messageName, channelName, 'message with this name is already defined.');
			}
			var messageId = Object.keys(channel.server).length + Object.keys(channel.client).length + 1;
			if(messageId > 0xff) throwMessageDefinitionError(isServerSide, messageName, channelName, 'too many messages defined');
			
			sideMapping[messageName] = messageId;
			reverseSideMapping[messageId] = messageName;
			sideObj[messageId] = [];
			
			forceAddMessageHandler(channelName, messageName, handler, handlerName, priority);
		},
		defineChannel: function(name, serverSideMessages, clientSideMessages){
			var id = Object.keys(this.channels).length + 1;
			if(id > 0xffffffff) throw new Error('Could not define channel "' + name + '": too many channels defined');
			
			var channel = {
				serverNameIdMapping: {},
				clientNameIdMapping: {},
				serverIdNameMapping: {},
				clientIdNameMapping: {},
				server: {},
				client: {}
			};
				
			this.channels[id] = channel;
			this.channelNameIdMapping[name] = id;
			this.channelIdNameMapping[id] = name;
			
			
			var messages = this.isServerSide? 
			Object.keys(serverSideMessages || {}).forEach(mName => this.defineMessage(name, mName, serverSideMessages[mName], true));
			Object.keys(clientSideMessages || {}).forEach(mName => this.defineMessage(name, mName, clientSideMessages[mName], false));
		},
		
		getDefinedChannels: function(){ return Object.keys(this.channelNameIdMapping) },
		getDefinedMessages: function(channelName, isServerSide){ 
			return Object.keys(this.channels[this.channelNameIdMapping[channelName]][(isServerSide? 'server': 'client') + 'NameIdMapping'])
		},
		getDefinedHandlers: function(channelName, messageName, isServerSide){
			var channel = this.channels[this.channelNameIdMapping[channelName]],
				handlers = channel[isServerSide? 'server: client'][channel[(isServerSide? 'server': 'client') + 'NameIdMapping'][messageName]],
				result = {};
				
			handlers.forEach(h => result[h.name] = h.priority);
			
			return result;
		},
		
		getHandlers: function(channelId, messageId){
			var channel = this.channels[channelId];
			if(!channel) return null;
			
			var handlers = (channel.server[messageId] || channel.client[messageId]);
			if(!handlers) return null;
			
			return handlers;
		},
		
		bufferizeUnreadMessage: function(channelId, messageId, reader){
			var messageBuffers = this.unhandledMessageBuffers[channelId] || (this.unhandledMessageBuffers[channelId] = {}),
				messageBuffer = messageBuffers[messageId] || (messageBuffers[messageId] = []);
				
			if(messageBuffer.length >= this.unhandledMessagesBufferSize)
		},
		tryUnbufferizeUnreadMessages: function(channelId, messageId){
			var handlers = this.getHandlers(channelId, messageId);
			if(!handlers) return false;
			
			var messages = ((this.unhandledMessageBuffers[channelId] || {})[messageId]);
			if(messages){
				delete this.unhandledMessageBuffers[channelId][messageId];
				if(Object.keys(this.unhandledMessageBuffers[channelId]).length === 0){
					delete this.unhandledMessageBuffers[channelId];
				}
				
				messages.forEach(msg => this.handleMessageWith(handlers, channelId, messageId, msg));
			}
			
			return true;
		},
		handleMessageWith: function(handlers, channelId, messageId, reader, index){
			var handler = handlers[index || 0];
			
			if(handler){
				try {
					var isUnhandled = handler.handler(reader);
					if(isUnhandled === true){
						this.handleMessageWith(handlers, reader, index + 1)
					}
				} catch(e){
					var channel = this.channels[channelId],
						channelName = this.channelIdNameMappind[channelId],
						messageName = channel.serverIdNameMapping[messageId] || channel.clientIdNameMapping[messageId],
						prefix = 'Error executing handler "' + handler.name + '" of message + "' + messageName + '" of channel "' + channelName + '": ';
						
					e.message = prefix + e.message;
					throw e;
				}
			} else {
				var channel = this.channels[channelId],
					channelName = this.channelIdNameMappind[channelId],
					messageName = channel.serverIdNameMapping[messageId] || channel.clientIdNameMapping[messageId];
					
				throw new Error('Failed to handle message "' + messageName + '" of channel "' + channelName + '": all installed handlers (' + handlers.length + ' of them) refuzed to handle the message.');
			}
		},
		receiveData: function(reader){
			var channelId = reader.getUint(),
				messageId = reader.getByte();
			var handlers = this.getHandlers(channelId, messageId);
			if(!handlers) return this.bufferizeMessage(channelId, messageId, channel.client)
			
			this.handleMessageWith(handlers, reader);
		},
		receive: function(reader){
			var messageType = reader.getByte();
			
			switch(messageType){
				case 0x00: // data
					return this.receiveData(reader);
				case 0x01: // define channel
					if(this.isServerSide) throw new Error('Received channel definition from client.');
					
				case 0x02: // ping
					if(this.isServerSide) throw new Error('Received ping from client.');
					
				case 0x03: // pong
					if(this.isClientSide) throw new Error('Received ping response from server.');
					
				default: throw new Error('Failed to handle incoming message: unknown basic message type code ' + messageType);
			}
		}
		
		/*
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
		*/
	}
	
	return Messenger;

});