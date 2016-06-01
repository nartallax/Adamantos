aPackage('nart.gl.shape.simple', () => {
	"use strict";
	
	var Shape = aRequire('nart.gl.shape'),
		TextureLoader = aRequire('nart.gl.texture.loader'),
		clutil = aRequire('nart.util.class'),
		glutil = aRequire('nart.gl.util');
				
	var SimpleShape = clutil.define(function(data, gl){					
		if(!(this instanceof SimpleShape)) return new SimpleShape(data, gl);
		
		Shape.call(this, data, gl); // all the basic properties
		
		this.setShapeType(data.shapeType)
			.setVertex(data.vertex)
			.setVertexNormals(data.vertexNormals)
			.setHighlightColor(data.highlightColor)
			// TODO create engine fabric that will create shapes etc depending on settings, for example color/texture usage
			//.setColor(data.color)
			.setVertexIndex(data.vertexIndex)
			.setTextureIndex(data.textureIndex)
			.setTexture(data.texture)
			.setTextureName(data.textureName)
	}, {
		setVertex: function(b){ return this.vertex = (glutil.bufferOf(this.gl, b, 3, this.gl.ARRAY_BUFFER, Float32Array) || null), this },
		// TODO: calculate normals from actual vertex data, it shouldnt be too hard
		setVertexNormals: function(b){
			return this.vertexNormals = (glutil.bufferOf(this.gl, b, 3, this.gl.ELEMENT_ARRAY_BUFFER, Float32Array) || null), this 
			//return this.vertexNormals = b, this
		},
		//setColor: function(b){ return this.color = (glutil.bufferOf(this.gl, b, 4, "ARRAY_BUFFER", Float32Array) || null), this },
		setVertexIndex: function(b){ 
			return this.vertexIndex = (glutil.bufferOf(this.gl, b, 1, this.gl.ELEMENT_ARRAY_BUFFER, Uint16Array) || null), this 
		},
		setTextureName: function(name, loader){ 
			return (name && (loader || SimpleShape.getTextureLoader()).get(name, t => this.setTexture(t))), this 
		},
		setTexture: function(tex){ return this.texture = tex, this },
		setTextureIndex: function(b){
			return this.textureIndex = (glutil.bufferOf(this.gl, b, 2, this.gl.ARRAY_BUFFER, Float32Array) || null), this;
		},
		setShapeType: function(t){ return this.shapeType = ((t === null || t === undefined)? this.gl.TRIANGLES: t), this },
		setHighlightColor: function(d){ return this.highlightColor = d, this }
	}, Shape);
	
	SimpleShape.defaultTextureLoader = null;
	
	SimpleShape.getTextureLoader = () => 
		SimpleShape.defaultTextureLoader || (SimpleShape.defaultTextureLoader = new TextureLoader(Shape.defaultGl))
	
	return SimpleShape;
	
});