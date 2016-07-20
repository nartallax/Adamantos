aPackage('nart.net.message.message', () => {

	var failToCreateMessageWriter = fail.formatted('Failed to create writer for message "$1" in channel "$2": $3.', 'WRITER_CREATE_FAILED'),
		failToAddHandler = fail.formatted('Failed to add handler "$1" with priority $2 to message "$3" on channel "$4": $5.', 'HANDLER_CREATE_FAILED'),
		failBasicOnWrongSide = fail.formatted('Failed to receive message "$1": this messages must not be handled on this side.', 'BASIC_MESSAGE_ON_WRONG_SIDE'),
		failNotConnected = fail.formatted('Failed to send message "$1" on channel "$2": not connected.', 'SEND_INTO_DISCONNECTED');
	
	var Message = function(name, channel, isServerSide){ 
		this.name = name;
		this.isServerSide = isServerSide;
		this.id = null;
		this.channel = channel;
		this.handlers = [];
		
		if(name.length < 2) fail.formatted('Failed to create message definition on channel "$2": name "$1" is too short.', 'NAME_TOO_SHORT')(name, channel.name);
		
		if(this.isOnSenderSide()){
			this.forceAddHandler(() => {
				fail.formatted('Failed to handle incoming message "$1" on channel "$2": message received on wrong side.', 'RECEIVED_ON_WRONG_SIDE')(name, channel.name);
			}, 'wrong-message-side-error-throwing-handler', 0xffffffff)
		}
	}
	
	Message.prototype = {
		isOnSenderSide: function(){
			return this.isServerSide === this.channel.messenger.isServerSide
		},
		// creates writer, calls callback to write the data and sends it
		writeAndSend: function(size, callback){
			var id = this.id, cid = this.channel.id;
				
			try {
				if(!cid) failToCreateMessageWriter(this.name, this.channel.name, 'no channel ID defined');
				if(!id) failToCreateMessageWriter(this.name, this.channel.name, 'no message ID defined');
				if(!this.isOnSenderSide()) failToCreateMessageWriter(this.name, this.channel.name, 'tried to send message from wrong side');
				if(!this.channel.messenger.isConnected) failNotConnected(this.name, this.channel.name);
			} catch(e){
				return this.channel.messenger.onError.fire(e);
			}
			
			var writer = this.channel.messenger.getDataWriter(cid, id, size);
			
			var initialPos = writer.getPosition();
			
			callback(writer, () => {
				var data = writer.getBuffer(),
					writtenBytes = writer.getPosition() - initialPos;
			
				if(writtenBytes !== size){
					fail.formatted('Failed to send written message "$1" on channel "$2": expected buffer size not matches actual ($3 !== $4).', 'BUFFER_SIZE_MESSED_UP')
						(this.name, this.channel.name, size, writtenBytes);
				}
				
				try {
					if(!this.channel.messenger.isConnected) failNotConnected(this.name, this.channel.name);
				} catch(e){
					return this.channel.messenger.onError.fire(e);
				}
				
				this.channel.messenger.sendArbitraryBinaryData(data);
			});
		},
		
		removeHandler: function(name){
			var oldLen = this.handlers.length;
			this.handlers = this.handlers.filter(h => h.name === name);
			if(oldLen === this.handlers.len) fail.formatted('Failed to remove handler "$1" from message "$2" on channel "$3": no handler found.', 'HANDLER_REMOVE_FAILED')
					(name, this.name, this.channel.name);
		},
		
		addHandler: function(handler, name, priority){
			if(this.isOnSenderSide()){
				failToAddHandler(name, priority, this.name, this.channel.name, 'could not handle incoming messages while on sender side')
			}
			
			this.forceAddHandler(handler, name, priority);
		},
		
		forceAddHandler: function(handler, name, priority){
			name = name || 'default';
			priority = priority || 0;
			
			if(name.length < 2) failToAddHandler(name, priority, this.name, this.channel.name, 'handler name is too short');
			if(priority < 0 || priority > 0xffffffff || typeof(priority) !== 'number'){
				failToAddHandler(name, priority, this.name, this.channel.name, 'incorrect priority value');
			}
			
			this.handlers.forEach(h => {
				if(h.name === name) failToAddHandler(name, priority, this.name, this.channel.name, 'handler with this name is already defined');
				if(h.priority === priority) failToAddHandler(name, priority, this.name, this.channel.name, 'handler with this priority is already defined');
			})
			
			this.handlers.push({handler: handler, name: name, priority: priority});
			this.handlers.sort((ha, hb) => ha.priority > hb.priority? -1: 1);
		},
		
		handle: function(message){
			for(var i = 0; i < this.handlers.length; i++){
				var isUnhandled = this.handlers[i].handler(message);
				if(isUnhandled !== false) return;
			}
			
			fail.formatted('Failed to handle message "$1" on channel "$2": all the handlers failed to handle the message.', 'ALL_HANDLERS_REFUSED')(this.name, this.channel.name);
		}
	}
	
	return Message;
});