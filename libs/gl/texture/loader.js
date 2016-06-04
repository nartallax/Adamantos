aPackage('nart.gl.texture.loader', () => {
	
	var ResourceLoader = aRequire('nart.gl.resource.loader'),
		TexturePacker = aRequire('nart.gl.texture.packer'),
		
		SimpleTexture = aRequire('nart.gl.texture.simple'),
		AnimatedTexture = aRequire('nart.gl.texture.animated');
	
	var TextureLoader = function(gl){
		if(!(this instanceof TextureLoader)) return new TextureLoader(gl);
		ResourceLoader.call(this, TexturePacker);
		
		this.gl = gl;
	}
	
	TextureLoader.prototype = new ResourceLoader();
	
	TextureLoader.prototype.usableToEngineObject = function(tex){
		return tex.frames.length === 1? 
			SimpleTexture(this.gl, tex.frames[0], tex.width, tex.height): 
			AnimatedTexture(this.gl, tex.frames, tex.width, tex.height);
	};
	
	return TextureLoader;
});