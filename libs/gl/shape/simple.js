aPackage('nart.gl.shape.simple', () => {
	"use strict";
	
	var Shape = aRequire('nart.gl.shape'),
		TextureLoader = aRequire('nart.gl.texture.loader'),
		clutil = aRequire('nart.util.class'),
		glutil = aRequire('nart.gl.util');
				
	var SimpleShape = clutil.define(function(data){					
		if(!(this instanceof SimpleShape)) return new SimpleShape(data);
		Shape.call(this, data); // all the basic properties
		
		this.setHighlightColor(data.highlightColor)
		
		if(data.primitives) {
			this.primitives = data.primitives;
		} else {
			this.primitives = [];
			if(data.vertex && data.vertexIndex && data.textureIndex && data.texture){
				this.addPrimitive(data.vertex, data.vertexIndex, data.texture, data.textureIndex);
			}
		}
	}, {
		setHighlightColor: function(d){ return this.highlightColor = d, this },
		
		getPrimitives: function(frameNum){ 
			return this.primitives 
		},
		
		addPrimitive: function(vertex, vertexIndex, texture, textureIndex){ 
			this.primitives.push({
				vertex: glutil.bufferOf(this.gl, vertex, 3, this.gl.ARRAY_BUFFER, Float32Array), 
				vertexIndex: glutil.bufferOf(this.gl, vertexIndex, 1, this.gl.ELEMENT_ARRAY_BUFFER, Uint16Array),
				texture: texture, 
				textureIndex: glutil.bufferOf(this.gl, textureIndex, 2, this.gl.ARRAY_BUFFER, Float32Array)}) 
		}
	}, Shape);
	
	SimpleShape.defaultTextureLoader = null;
	
	SimpleShape.getTextureLoader = () => 
		SimpleShape.defaultTextureLoader || (SimpleShape.defaultTextureLoader = new TextureLoader(Shape.defaultGl))
	
	return SimpleShape;
	
});