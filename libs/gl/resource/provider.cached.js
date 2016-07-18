// cached resource provider
// instead of ResourceProvider, is actually usable 
// (abstract provider violates general resource contract - one resource = one instance)
aPackage('nart.gl.resource.provider.cached', () => {
	
	var ResourceProvider = aRequire('nart.gl.resource.provider'),
		protoOf = aRequire('nart.util.class').proto;
		
	var CachedResourceProvider = function(fetchData, dataToResource){
		if(!(this instanceof CachedResourceProvider)) return new CachedResourceProvider(fetchData, dataToResource);
		
		this.cache = {};
		ResourceProvider.call(this, fetchData, dataToResource);
	}
	
	var superGet = ResourceProvider.prototype.get,
		superUnload = ResourceProvider.prototype.unloadResource;
	
	CachedResourceProvider.prototype = protoOf(ResourceProvider, {
		get: function(name, cb){
			if(name in this.cache) {
				return setImmediate(() => {
					// double-check
					if(!(name in this.cache)) return this.get(name, cb)
						
					cb(cache[name]);
				})
			}
			
			superGet.call(this, name, resource => {
				this.cache[name] = resource;
				cb(resource);
			});
		},
		
		removeFromCache: function(name){ delete this.cache[name] },
		
		unloadResource: function(resource){
			this.removeFromCache(resource.name);
			superUnload.call(this, resource);
		}
	});
	
	return CachedResourceProvider;
	
})