// abstract resource provider
// TODO: reduce boilerplate code amount required to create new class, maybe by some omnipresent utils
aPackage('nart.gl.resource.provider', () => {
	
	var Event = aRequire('nart.util.event');
	
	var ResourceProvider = function(fetchData, dataToResource){
		if(!(this instanceof ResourceProvider)) return new ResourceProvider(fetchData, dataToResource);
		
		this.dataToResource = dataToResource;
		this.fetchData = fetchData;
		
		this.onResourceCompletelyDereferenced = new Event();
		
		this.onResourceCompletelyDereferenced(e => this.unloadResource(e.data));
	}
	
	ResourceProvider.prototype = {
		get: function(name, cb){
			this.fetchData(name, data => {
				this.dataToResource(data, name, resource => {
					resource.setCompletelyDereferencingEvent(this.onResourceCompletelyDereferenced);
					cb(resource);
				});
			})
		},
		
		// should be overriden in inheritors to implement cacheing
		unloadResource: function(resource){ resource.free(); }
	}
	
	return ResourceProvider;
});