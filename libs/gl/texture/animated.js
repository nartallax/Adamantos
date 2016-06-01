aPackage('nart.gl.texture.animated', () => {
	
	var proto = aRequire('nart.util.class').proto,
		SimpleTexture = aRequire('nart.gl.texture.simple');

	var AnimatedTexture = function(gl, bytesOfFrames, w, h){
		if(!(this instanceof AnimatedTexture)) return new AnimatedTexture(gl, bytesOfFrames, w, h);
		
		this.gl = gl;
		this.frames = bytesOfFrames.map(b => this.createFrame(b, w, h));
		this.frameNum = 0;
	}
	
	AnimatedTexture.prototype = proto(SimpleTexture, {
		getFrame: function(){
			return this.frames[this.frameNum = (this.frameNum + 1) % this.frames.length];
		}
	})
	
	return AnimatedTexture;

});