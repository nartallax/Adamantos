// some resource - texture, model etc
// needed to control the number of instances of particular resource

// resource with each name and type combination instantiated only once and then just referenced
// each time reference happens refcounter should increment, and it should be decremented on dereference
// it is needed to control the caches and unload underlying resources (for example, GPU-side memory structures)

// resource's children are not changeable at any point of time
// it's expected that each resource have fixed children (i.e. model have fixed textures)
// if there will be need to dynamically reference resources, it will be more wise to use nart.gl.resource.resource.dynamic
aPackage('nart.e8.resource.static', () => {
	
	// TODO: handle possible overflow
	var idCounter = Number.MIN_SAFE_INTEGER;
	
	// TODO: maybe split up into separate classes?
	var Resource = function(name, children){
		this.name = name;
		this.refcount = 0;
		this.id = Resource.generateId();
		this.children = children || null;
		this.onCompletelyDereferenced = null;
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
			this.refcount === 0 && this.onCompletelyDereferenced && this.onCompletelyDereferenced.fire(this);
		},
		
		setCompletelyDereferencingEvent: function(ev){
			this.onCompletelyDereferenced = ev;
		},
		
		// unload resource from memory
		// it makes sense to call this function when the reference counter reaches zero
		// but sometimes we may want to cache it somehow
		// so this function is called elsewhere
		free: function(){ throw new Error("Don't know how to free resource."); }
	}
	
	return Resource;
	
});