aPackage('nart.gl.texture.animated', () => {
	
	var proto = aRequire('nart.util.class').proto,
		SimpleTexture = aRequire('nart.gl.texture.simple');

	var AnimatedTexture = function(gl, bytesOfFrames, w, h){
		if(!(this instanceof AnimatedTexture)) return new AnimatedTexture(gl, bytesOfFrames, w, h);
		
		this.gl = gl;
		this.frames = bytesOfFrames.map(b => this.createFrame(b, w, h));
	}
	
	AnimatedTexture.prototype = proto(SimpleTexture, {
		getFrame: function(frameNum){
			return this.frames[frameNum % this.frames.length];
		}
	})
	
	return AnimatedTexture;

});