aPackage('nart.gl.shader.typical', () => {
	"use strict";

	var ShaderPack = aRequire('nart.gl.shader.pack'),
		mat4 = aRequire('nart.gl.external.matrix').mat4,
		mat3 = aRequire('nart.gl.external.matrix').mat3;
	
	var clear = function(b){
		
		this.setFramebuffer(null);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		
		mat4.identity(b.modelViewMatrix);
		
		//this.gl.uniform1i(b.shaderProgram.samplerUniform, 0);
		
		this.projectionMatrix.set(b.projectionMatrix)
		
		b.ambientColorBuffer && this.ambientColor.set(b.ambientColorBuffer)
		//b.lightDirection && this.lightingDirection.set(b.lightDirection)
		//b.lightColor && this.lightingColor.set(b.lightColor)
	}
	
	var drawWithMatrix = (t, s, m) => {
		var gl = t.gl;
		
		t.withTranslatedMatrix(t.viewMatrix, m, s, m => {
			if(s.childShapes){
				var c = s.childShapes;
				for(var i in c) drawWithMatrix(t, c[i], m);
			} else {
				// TODO: make it possible to alter transparency for composite shapes, not only simple shapes
				/*
				if(s.transparency !== 1){
					gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
					gl.enable(gl.BLEND);
					gl.disable(gl.DEPTH_TEST);
				} else {
					gl.disable(gl.BLEND);
					gl.enable(gl.DEPTH_TEST);
				}
				*/
				
				t.alpha.set([s.transparency])
				
				t.vertexPosition.set(s.vertex);
				//t.vertexNormals.set(s.vertexNormals);
				
				gl.activeTexture(gl.TEXTURE0);
				//gl.bindTexture(gl.TEXTURE_2D, s.texture);
				gl.bindTexture(gl.TEXTURE_2D, s.texture.getFrame());
				//gl.uniform1i(program.samplerUniform, 0);
				
				t.highlightColor.set(s.highlightColor || [0, 0, 0]);
				
				// TODO: maybe move somewhere else?
				/*
				var normalMatrix = mat3.create();
				mat4.toInverseMat3(m, normalMatrix);
				mat3.transpose(normalMatrix);
				t.normalMatrix.set(normalMatrix)
				*/
				
				// color only
				//t.setColor(t.color);
				t.textureIndex.set(s.textureIndex);
				
				if(s.vertexIndex){
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, s.vertexIndex)
					gl.drawElements(s.shapeType, s.vertexIndex.numItems, gl.UNSIGNED_SHORT, 0);
				} else {
					t.gl.drawArrays(s.shapeType, 0, t[t.countingBufferName].count)
				}
			}
		})
	}
	
	var draw = function(s, b){ 
		drawWithMatrix(this, s, b.modelViewMatrix) 
	}
	
	return (gl, params) => new ShaderPack(gl, `
		attribute vec3 aVertexPosition;
		//attribute vec3 aVertexNormal;
		
		// color only
		//attribute vec4 aVertexColor;
		attribute vec2 aTextureCoord;

		uniform mat4 uMVMatrix;
		uniform mat4 uPMatrix;
		//uniform mat3 uNMatrix;
		
		uniform vec3 uAmbientColor;
		uniform vec3 uHighlightColor;
		
		//uniform vec3 uLightingDirection;
		//uniform vec3 uDirectionalColor;
		
		// color only
		//varying vec4 vColor;
		varying vec2 vTextureCoord;
		varying vec3 vLightWeighting;

		void main() {
			gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
			vTextureCoord = aTextureCoord;
			
			// no ligting
			//vLightWeighting = vec3(1.0, 1.0, 1.0);
			
			//vec3 transformedNormal = uNMatrix * aVertexNormal;
			//float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);
			vLightWeighting = uAmbientColor + uHighlightColor/* + uDirectionalColor * directionalLightWeighting*/;
			
			// color only
			//vColor = aVertexColor;
		}
		`,`
		precision mediump float;
		
		// color only
		//varying vec4 vColor;
		
		uniform float alpha;
		
		varying vec2 vTextureCoord;
		varying vec3 vLightWeighting;
		
		uniform sampler2D uSampler;

		void main() {
			vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
			gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a * alpha);
			
			// no lighting
			//gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
					
			//gl_FragColor = vColor;
		}						
		`, [
		{name: 'textureIndex', innerName: 'aTextureCoord'},
		{name: 'vertexPosition', innerName: 'aVertexPosition', isCounting: true},
		{name: 'projectionMatrix', innerName: 'uPMatrix', isUniform: true, width: 4, isMatrix: true},
		{name: 'viewMatrix', innerName: 'uMVMatrix', isUniform: true, width: 4, isMatrix: true},
		//{name: 'normalMatrix', innerName: 'uNMatrix', isUniform: true, width: 3, isMatrix: true},
		{name: 'ambientColor', innerName: 'uAmbientColor', isUniform: true, width: 3,},
		{name: 'highlightColor', innerName: 'uHighlightColor', isUniform: true, width: 3},
		//{name: 'vertexNormals', innerName: 'aVertexNormal', bufferType: gl.ELEMENT_ARRAY_BUFFER},
		{name: 'alpha', innerName: 'alpha', isUniform: true, width: 1},
		
		// TODO: make many directional lights possible
		//{name: 'lightingDirection', innerName: 'uLightingDirection', isUniform: true, width: 3},
		//{name: 'lightingColor', innerName: 'uDirectionalColor', isUniform: true, width: 3}
	], clear, draw);
	
});