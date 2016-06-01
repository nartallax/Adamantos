aPackage('nart.gl.texture.loader.packed', () => {
	
	var defineClass = aRequire('nart.util.class').define,
		TextureLoader = aRequire('nart.gl.texture.loader'),
		TexturePacker = aRequire('nart.gl.texture.packer'),
		Requester = aRequire('nart.net.http.requester.xhr'),
		base64 = aRequire('nart.util.base64'),
		eachAsync = aRequire('nart.util.collections').eachAsync,
		
		SimpleTexture = aRequire('nart.gl.texture.simple'),
		AnimatedTexture = aRequire('nart.gl.texture.animated');
	
	var getBytes = (url, cb) => Requester.get(url, {}, res => cb(res.body), { resultInBuffer: true }),
		readTextures = (bytes, gl) => {
			var result = TexturePacker.unpack(bytes);
			
			Object.keys(result).forEach(k => {
				var tex = result[k];
				result[k] = tex.frames.length === 1? 
					SimpleTexture(gl, tex.frames[0], tex.width, tex.height): 
					AnimatedTexture(gl, tex.frames, tex.width, tex.height);
			});
			
			return result;
		};
	
	var PackedTextureLoader = defineClass(function(gl){
		if(!(this instanceof PackedTextureLoader)) return new PackedTextureLoader(gl);
		TextureLoader.call(this, gl);
		this.packs = [];
	}, {
		downloadPack: function(url, cb){
			Requester.get(url, {}, res => {
				this.packs.push(res.body);
				cb();
			}, { resultInBuffer: true })
		},
		extractPacks: function(cb){
			//console.log('Extracting from ' + this.packs.length + ' packs');
			this.packs.forEach(p => {
				var texs = readTextures(p, this.gl);
				Object.keys(texs).forEach(name => this.defineTexture(name, texs[name]));
			})
			cb();
			return this;
		}
	}, TextureLoader);
	
	return PackedTextureLoader;
});