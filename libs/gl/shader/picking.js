aPackage('nart.gl.shader.picking', () => {
	"use strict";
	
	var ShaderPack = aRequire('nart.gl.shader.pack'),
		mat4 = aRequire('nart.gl.external.matrix').mat4;
	
	var clear = function(b){
			
		var gl = this.gl;
		
		if(!this.fb) this.fb = gl.createFramebuffer()
		if(!this.rttTexture) this.rttTexture = gl.createTexture();
		if(!this.renderbuffer) this.renderbuffer = gl.createRenderbuffer();

		this.setFramebuffer(this.fb);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
		//this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT | this.gl.STENCIL_BUFFER_BIT);
		
		//this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		mat4.identity(b.modelViewMatrix);
		
		gl.bindTexture(gl.TEXTURE_2D, this.rttTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.viewportWidth, gl.viewportHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, b.gl.viewportWidth, b.gl.viewportHeight);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.rttTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);
		
		this.colorCounter = 0;
		this.idMap = {};
		
		this.projectionMatrix.set(b.projectionMatrix)
	}
	
	var drawWithMatrix = (t, s, m) => {
		t.withTranslatedMatrix(t.viewMatrix, m, s, m => {
			if(s.childShapes){
				var c = s.childShapes;
				for(var i in c) drawWithMatrix(t, c[i], m);
			} else {
				var gl = t.gl;
				
				var id = ++t.colorCounter;
				t.idMap[id] = s.id;
				
				// TODO: too many arithmetic for JS-side
				t.color.set([((id & 0xff0000) >> 16) / 255, ((id & 0x00ff00) >> 8) / 255, (id & 0x0000ff) / 255, 1]);
				t.vertexPosition.set(s.vertex);
				
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
		return drawWithMatrix(this, s, b.modelViewMatrix)
	}
	
	return gl => new ShaderPack(gl, `
		attribute vec3 aVertexPosition;
		
		uniform vec4 aVertexColor;
		
		uniform mat4 uMVMatrix;
		uniform mat4 uPMatrix;
		
		varying vec4 vColor;
		
		void main() {
			gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
			vColor = aVertexColor;
		}
		`,`
		precision mediump float;
		
		varying vec4 vColor;
		
		void main() {
			gl_FragColor = vColor;
		}						
		`, [
		{name: 'vertexPosition', innerName: 'aVertexPosition', isCounting: true},
		{name: 'projectionMatrix', innerName: 'uPMatrix', isUniform: true, width: 4, isMatrix: true},
		{name: 'viewMatrix', innerName: 'uMVMatrix', isUniform: true, width: 4, isMatrix: true},
		{name: 'color', innerName: 'aVertexColor', isUniform: true, width: 4}
	], clear, draw)
	
});