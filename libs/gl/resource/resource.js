// some resource - texture, model etc
// needed to control the number of instances of particular resource

// resource with each name and type combination instantiated only once and then just referenced
// each time reference happens refcounter should increment, and it should be decremented on dereference
// it is needed to control the caches and unload underlying resources (for example, GPU-side memory structures)

// resource's children are not changeable at any point of time
// it's expected that each resource have fixed children (i.e. model have fixed textures)
// if there will be need to dynamically reference resources, it will be more wise to use nart.gl.resource.resource.dynamic
aPackage('nart.gl.resource.resource', () => {
	
	// TODO: handle possible overflow
	var idCounter = Number.MIN_SAFE_INTEGER;
	
	// TODO: maybe split up into separate classes?
	var Resource = function(children){
		this.refcount = 0;
		this.id = Resource.generateId();
		this.children = children || null;
	}
	
	Resource.generateId = () => idCounter++;
	
	Resource.prototype = {
		getReferenceCount: function(){ return this.refcount },
		
		reference: function(){ 
			this.refcount++;
			this.children.forEach(ch => ch.reference());
		},
		dereference: function(){ 
			this.refcount--;
			this.children.forEach(ch => ch.dereference());
		}
	}
	
	return Resource;
	
});