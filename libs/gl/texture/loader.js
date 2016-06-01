aPackage('nart.gl.texture.loader', () => {
	"use strict"
	
	var eachAsync = aRequire('nart.util.collections').eachAsync;

	var TextureLoader = function(gl){
		if(!(this instanceof TextureLoader)) return new TextureLoader(gl);
	
		this.cache = {};
		this.loadListeners = {};
		this.gl = gl;
	}
	
	TextureLoader.prototype = {
		get: function(name, body){ 
			this.cache[name]? 
				body(this.cache[name]): 
				this.loadListeners[name]?
					(body && this.loadListeners[name].push(body)):
					((body && (this.loadListeners[name] = []).push(body)), this.forceLoad(name))
				
			return this;
		},
		defineTexture: function(name, tex){
			this.cache[name] = tex;
			
			(this.loadListeners[name] || []).forEach(l => l(tex));
			delete this.loadListeners[name];
			
			return this;
		},
		forceLoad: function(name){
			throw new Error('Texture cache miss for "' + name + '"');
			/*
			var gl = this.gl;
			var tex = gl.createTexture();
			tex.image = new Image();
			
			tex.image.onload = () => this.defineTexture(path, tex.image, null, null, tex);

			tex.image.src = path;
			
			return this;
			*/
		},
		preloadAll: function(items, after){
			eachAsync(items, (i, cb) => this.get(i, cb), after);
			return this;
		}
	}
	
	return TextureLoader;
	
});