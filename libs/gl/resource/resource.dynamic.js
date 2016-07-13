// dynamic resource
// allows to track resources with dynamically changing children
// (for example, sword model with socket for arbitrary gem in it)

// there is big difference with typical resources: dynamic resource is instantiated every time it is needed (not once)
// and could be referenced/dereferenced only once
aPackage('nart.gl.resource.resource.dynamic', () => {
	
	var Resource = aRequire('nart.gl.resource.resource');
	
	var DynamicResource = function(){
		this.children = {};
		this.id = Resource.generateId();
		this.isReferenced = false;
	}
	
	DynamicResource.prototype = {
		// TODO: maybe enable reference checking? it could slow performance due to deopt on 'throw'
		reference: function(){ 
			this.isReferenced = true;
			Object.keys(this.children).forEach(id => this.children[id].reference());
		},
		dereference: function(){ 
			this.isReferenced = false;
			Object.keys(this.children).forEach(id => this.children[id].dereference());
		},
		
		getReferenceCount: function(){ return this.isReferenced? 1: 0 },
		
		addChild: function(res){
			this.isReferenced && res.reference();
			this.children[res.id] = res;
		},
		removeChild: function(res){
			var id = (res && res.id)? res.id: res;
			var child = this.children[id];
			this.isReferenced && res.dereference();
			delete this.children[id];
		}
		
	}
	
	return DynamicResource;
	
});