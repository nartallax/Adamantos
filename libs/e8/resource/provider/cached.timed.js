// resource provider that removes completely dereferenced resources after a timeout
aPackage('nart.e8.resource.provider.cached.timed', () => {

	var CachedResourceProvider = aRequire('nart.e8.resource.provider.cached'),
		protoOf = aRequire('nart.util.class').proto;

	var TimedCachedResourceProvider = function(cachingTimeout, fetchData, dataToResource){
		if(!(this instanceof TimedCachedResourceProvider)) return new TimedCachedResourceProvider(cachingTimeout, fetchData, dataToResource);
		
		this.cachingTimeout = cachingTimeout;
		CachedResourceProvider.call(this, fetchData, dataToResource);
	}
	
	var superUnload = CachedResourceProvider.protype.unloadResource;
	
	TimedCachedResourceProvider.prototype = protoOf(CachedResourceProvider, {
		unloadResource: function(resource){
			setTimeout(() => (resource.getReferenceCount() < 1) && superUnload.call(this, resource), this.cachingTimeout);
		}
	});
	
	return TimedCachedResourceProvider;

})