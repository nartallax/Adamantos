aPackage('nart.net.message.channel', () => {

	var Channel = function(name, messenger){ 
		this.messenger = messenger; 
		this.name = name; 
		this.id = null; 
		this.server = {}; 
		this.client = {};
		
		this.serverIdNameMapping = {};
		this.clientIdNameMapping = {};
		
		if(name.length < 2) Throw.formatted('Failed to create channel definition: name "$1" is too short.', 'NAME_TOO_SHORT')(name);
	};
	
	Channel.prototype = {
		isServerDefined: function(){ return this.id? true: false },
		
		handle: function(message){
			var msgId = message.getByte();
			var isServerSide = msgId in this.serverIdNameMapping;
			var name = (isServerSide? this.serverIdNameMapping: this.clientIdNameMapping)[msgId];
			
			if(!name){
				Throw.formatted('Failed to handle message with ID = $1 on channel "$2": no message found for this ID.', 'UNKNOWN_ID')(msgId, this.name);
			}
			
			(isServerSide? this.server: this.client)[name].handle(message);
		},
		
		define: function(){
			if(!this.messenger.isServerSide){
				Throw.formatted('Could not define channel "$1" on client-side: channels are defined and undefined on server-side.', 'DEFINITION_ON_WRONG_SIDE')(this.name);
			}
			
			var ids = this.generateIds();
			
			this.setDefinition(ids.id, ids.server, ids.client);
		},
		
		undefine: function(){
			if(!this.messenger.isServerSide){
				Throw.formatted('Could not undefine channel "$1" on client-side: channels are defined and undefined on server-side.', 'UNDEFINITION_ON_WRONG_SIDE')(this.name);
			}
			
			this.forceUnsetDefinition();
		},
	
		forceUnsetDefinition: function(){
			if(!this.isServerDefined()){
				Throw.formatted('Failed to undefine channel "$1": it is not defined.', 'DUPLICATE_UNDEFINITION')(this.name);
			}
			
			var oldId = this.id;
			
			this.id = null;
			Object.keys(this.server).forEach(name => this.server[name].id = null);
			Object.keys(this.client).forEach(name => this.client[name].id = null);
			
			this.messenger.onChannelUndefined.fire({channel: this, id: oldId});
		},
		
		setDefinition: function(id, serverMap, clientMap){
			if(this.isServerDefined()){
				Throw.formatted('Failed to set definition of channel "$1": the channel is already defined.', 'DUPLICATE_DEFINITION')(this.name);
			}
			
			var consumeForSide = (side, idNameMapping, sourceMapping, sideName) => {
				Object.keys(sourceMapping).forEach(name => {
					var id = sourceMapping[name];
					idNameMapping[id] = name;
					
					if(!(name in side)){
						Throw.formatted('Failed to set definition for $1-side message "$2" on channel "$3": there is no message with this name on this side.', 'UNKNOWN_NAME')
							(sideName, name, this.name);
					}
					
					side[name].id = id;
				});
			}
			
			this.id = id;
			
			consumeForSide(this.server, this.serverIdNameMapping = {}, serverMap, 'server');
			consumeForSide(this.client, this.clientIdNameMapping = {}, clientMap, 'client');
			
			this.messenger.onChannelDefined.fire({channel: this, id: id, serverMap: serverMap, clientMap: clientMap});
		},
		
		generateIds: function(){
			if(!this.messenger.isServerSide){
				Throw.formatted('Could not generate IDs for channel "$1": IDs should be generated server-side only.', 'ID_GENERATOR_ON_WRONG_SIDE')(this.name);
			}
			
			if(this.isServerDefined()){
				Throw.formatted('Could not generate IDs for channel "$1": defined channel could not be modified.', 'DEFINED_MODIFICATION')(this.name);
			}
			
			var serverKeys = Object.keys(this.server),
				clientKeys = Object.keys(this.client),
				msgId = 1;
				
			if(serverKeys.length + clientKeys.length > 0xfe){
				Throw.formatted('Could not generate definition for channel "$1": too many messages defined (max: $2, have: $3)', 'TOO_MANY_MESSAGES')
					(this.name, 0xfe, serverKeys.length + clientKeys.length);
			}
			
			var generateFor = keys => {
				var result = {};
				keys.forEach(name => result[name] = msgId++);
				return result;
			}
			
			return {
				id: this.messenger.generateChannelId(),
				server: generateFor(serverKeys),
				client: generateFor(clientKeys)
			}
		},
		
		addMessage: function(message){
			if(this.isServerDefined()){
				Throw.formatted('Could not add message to channel "$1": defined channel could not be modified.', 'DEFINED_MODIFICATION')(this.name);
			}
			
			var side = message.isServerSide? this.server: this.client;
			
			if(message.name in side){
				Throw.formatted('Could not add message to channel "$1": duplicate message name "$2".', 'DUPLICATE_DEFINITION')(this.name, message.name);
			}
			
			side[message.name] = message;
		},
		
		removeMessage: function(message){
			if(this.isServerDefined()){
				Throw.formatted('Could not remove message from channel "$1": defined channel could not be modified.', 'DEFINED_MODIFICATION')(this.name);
			}
			
			var side = message.isServerSide? this.server: this.client;
			
			if(!(message.name in side)){
				Throw.formatted('Could not remove message from channel "$1": no message named "$2".', 'ABSENT_DEFINITION')(this.name, message.name);
			}
			
			delete side[message.name];
		}
	};
	
	return Channel;

});