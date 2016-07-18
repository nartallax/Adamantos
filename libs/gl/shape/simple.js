aPackage('nart.gl.shape.simple', () => {
	"use strict";
	
	var clutil = aRequire('nart.util.class'),
		glutil = aRequire('nart.gl.util');
				
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
		/*
		addPrimitive: function(vertex, vertexIndex, texture, textureIndex){
			this.primitives.push({
				vertex: glutil.bufferOf(this.gl, vertex, 3, this.gl.ARRAY_BUFFER, Float32Array), 
				vertexIndex: glutil.bufferOf(this.gl, vertexIndex, 1, this.gl.ELEMENT_ARRAY_BUFFER, Uint16Array),
				texture: texture, 
				textureIndex: glutil.bufferOf(this.gl, textureIndex, 2, this.gl.ARRAY_BUFFER, Float32Array)
			}) 
		}*/
		
	}, Resource);
	
	return SimpleShape;
	
});