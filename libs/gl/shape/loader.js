aPackage('nart.gl.shape.loader', () => {
	
	var ResourceLoader = aRequire('nart.gl.resource.loader'),
		ShapePacker = aRequire('nart.gl.shape.packer'),
		
		SimpleShape = aRequire('nart.gl.shape.simple');
	
	var ShapeLoader = function(gl, texLoader){
		if(!(this instanceof ShapeLoader)) return new ShapeLoader(gl);
		ResourceLoader.call(this, ShapePacker);
		
		this.gl = gl;
		this.texLoader = texLoader;
	}
	
	ShapeLoader.prototype = new ResourceLoader();
	
	ShapeLoader.prototype.usableToEngineObject = function(primitives){
		var shape = new SimpleShape({gl: this.gl, highlightColor: [0, 0, 0]});
		
		Object.keys(primitives).forEach(texName => {
			var prim = primitives[texName];
			shape.addPrimitive(prim.vertex, prim.vertexIndex, this.texLoader.get(texName), prim.textureIndex);
		});
		
		return shape;
	};
	
	return ShapeLoader;
});