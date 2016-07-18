// resource provider on client
aPackage('nart.gl.resource.provider.client', () => {
	
	var CachedProvider = aRequire('nart.gl.resource.provider.cached.timed'),
		ClientResourceLoader = aRequire('nart.gl.resource.loader.client'),
		protoOf = aRequire('nart.util.class').proto;
	
	var ClientResourceProvider = function(cachingTime, messenger, channelName, dataToResource){
		if(!(this instanceof ClientResourceProvider)) return new ClientResourceProvider(messenger, channelName, dataToResource);
		
		this.loader = new ClientResourceLoader(messenger, channelName);
		
		CachedProvider.call(this, cachingTime, (name, cb) => this.loader.get(name, cb), dataToResource);
	}
	
	ClientResourceProvider.prototype = protoOf(CachedProvider, {
		inheritWithChannelAndFabric: function(channelName, dataToResource, constructor){
			
			var InheritedProvider = function(cacheTimeout, messenger){
				if(!(this instanceof InheritedProvider)) return new InheritedProvider(cacheTimeout, messenger);
				
				constructor && constructor.apply(this, arguments);
				
				ClientResourceProvider.call(this, cacheTimeout, messenger, channelName, dataToResource);
			}
			
			InheritedProvider.prototype = protoOf(ClientResourceProvider);
			
			return InheritedProvider;
			
		}
	});
	
	return ClientResourceProvider;
	
});