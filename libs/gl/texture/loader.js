aPackage('nart.gl.texture.loader', () => {
	
	var defineClass = aRequire('nart.util.class').define,
		TexturePacker = aRequire('nart.gl.texture.packer'),
		Requester = aRequire('nart.net.http.requester.xhr'),
		base64 = aRequire('nart.util.base64'),
		eachAsync = aRequire('nart.util.collections').eachAsync,
		
		SimpleTexture = aRequire('nart.gl.texture.simple'),
		AnimatedTexture = aRequire('nart.gl.texture.animated');
	
	var getBytes = (url, cb) => Requester.get(url, {}, res => cb(res.body), { resultInBuffer: true }),
		readTextures = (bytes, gl, cb) => {
			var packer = new TexturePacker();
			packer.addPack(bytes);
			packer.getUsables(result => {
				
				Object.keys(result).forEach(k => {
					var tex = result[k];
					result[k] = tex.frames.length === 1? 
						SimpleTexture(gl, tex.frames[0], tex.width, tex.height): 
						AnimatedTexture(gl, tex.frames, tex.width, tex.height);
				});
				
				cb(result);
			});
		};
	
	var TextureLoader = function(gl){
		if(!(this instanceof TextureLoader)) return new TextureLoader(gl);
		
		this.cache = {};
		this.gl = gl;
		this.packs = [];
	};
	
	TextureLoader.prototype = {
		get: function(name){ 
			if(!(name in this.cache)){
				throw new Error('No texture defined: "' + name + '"');
			}
			return this.cache[name];
		},
		downloadPack: function(url, cb){
			Requester.get(url, {}, res => {
				this.packs.push(res.body);
				cb();
			}, { resultInBuffer: true })
		},
		extractPacks: function(cb){
			this.packs.forEach(p => {
				readTextures(p, this.gl, texs => {
					Object.keys(texs).forEach(name => this.cache[name] = texs[name]);
					
					cb();
				});
			});
			
			this.packs = [];
			return this;
		}
	}
	
	
	return TextureLoader;
});