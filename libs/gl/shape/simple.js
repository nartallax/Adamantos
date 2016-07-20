aPackage('nart.gl.shape.simple', () => {
	"use strict";
	
	var clutil = aRequire('nart.util.class'),
		glutil = aRequire('nart.gl.util'),
		Resource = aRequire('nart.gl.resource.resource')
				
	var SimpleShape = clutil.define(function(name, primitives, gl){
		if(!(this instanceof SimpleShape)) return new SimpleShape(name, gl);
		this.gl = gl;
		this.primitives = primitives;
		Resource.call(this, name, primitives.map(p => p.texture));
	}, {
		getPrimitives: function(frameNum){ return this.primitives },
		
		free: function(){
			this.primitives.forEach(p => {
				this.gl.deleteBuffer(p.vertex);
				this.gl.deleteBuffer(p.vertexIndex);
				this.gl.deleteBuffer(p.textureIndex);
				// а текстуры сами удалятся, когда на них референсов не будет больше
			});
		}
		
	}, Resource);
	
	return SimpleShape;
	
});