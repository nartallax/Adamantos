// загрузчик ресурсов поверх Messenger
aPackage('nart.e8.resource.loader.messenger', () => {

	var protoOf = aRequire('nart.util.class').proto,
		RequestingLoader = aRequire('nart.e8.resoure.loader.requesting'),
		Event = aRequire('nart.util.event'),
		Manip = aRequire('nart.util.byte.manipulator');

	var LoaderOverMessenger = function(msgr, channelName, findDataFunction, packData, unpackData){
		if(!(this instanceof LoaderOverMessenger)) return new LoaderOverMessenger(msgr, channelName, findDataFunction, packData, unpackData);
		
		packData = packData || d => d
		unpackData = unpackData || d => d
		
		this.onResourceNotFound = new Event();
		
		var channel = msgr.createChannel({
			name: channelName,
			server: {
				resource: function(data){
					
					var resourceName = data.getString();
					resourceReceivedEvent.fire({name: resourceName, data: unpackData(data)})
					
				}
			},
			client: {
				request: function(data){
					
					var resourceName = data.getString();
					findDataFunction(resourceName, resource => {
						if(resource === null){
							return this.onResourceNotFound.fire({name: resourceName});
						}
						channel.resource.writeAndSend(Manip.stringSize(resourceName) + resource.length, (writer, cb) => {
							writer.putString(resourceName);
							writer.putBytes(packData(resource));
							cb();
						});
					});
					
				}
			}
		})
		
		this.resourceReceivedEvent = new Event();
		var requestResource = name => {
			channel.client.request.writeAndSend(Manip.stringSize(name), (writer, cb) => {
				writer.putString(name);
				cb();
			})
		}
		
		this.findDataFunction = fundDataFunction; // (name, cb) => {}
		
		RequestingLoader.call(this, requestResource, resourceReceivedEvent);
	}
	
	LoadOverMessenger.prototype = protoOf(RequestingLoader);
	
	
	return LoaderOverMessenger;

})