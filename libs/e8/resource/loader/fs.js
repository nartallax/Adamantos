// a resource loader that loads resources directly from filesystem
aPackage('nart.e8.resource.loader.fs', () => {

	var eachFileRecursiveIn = aRequire('nart.util.fs').eachFileRecursiveIn,
		eachAsync = aRequire('nart.util.collections').eachAsync,
		fs = aRequire.node('fs'),
		err = aRequire('nart.util.err');

	var pathToName = (texturePath, prefixPath, prefixName) => {
		texturePath = texturePath.replace(/\.[^.\\\/]+$/, '');
		
		// no fake separators allowed
		if(texturePath.indexOf('.') > 0) return null;
		
		var parts = splitPath(texturePath);
		
		if(prefixPath) parts = parts.slice(splitPath(prefixPath).length);
		prefixName = (prefixName || '').split('.').filter(f => f);
		
		return prefixName.concat(parts).join('.');
	};
	
	var FsLoader = function(dirs, filenameFilter){
		if(!(this instanceof FsLoader)) return new FsLoader(dir, filenameFilter);
		
		this.baseDirs = dirs;
		this.filenameFilter = filenameFilter || /.*/;
		this.nameToFileMap = {};
		
		this.refreshWaiters = null;
		this.refreshMapping();
	};
	
	FsLoader.prototype = {
		get: function(name, cb){
			this.getPathTo(name, path => {
				if(path === null) return cb(null);
				fs.readFile(path, err(cb));
			})
		},
		
		refreshMapping: function(cb){
			if(this.refreshWaiters){
				return cb && this.refreshWaiters.push(cb);
			}
			
			this.refreshWaiters = cb? [cb]: [];
			
			var mapping = {};
			
			eachAsync(this.baseDirs, (baseDir, cb) => {
				eachFileRecursiveIn(baseDir, 
					path => path.toLowerCase().match(this.filenameFilter) && (mapping[pathToName(path)] = path), 
					cb
				);
			}, () => {
				this.nameToFileMap = mapping;
					
				var waiters = this.refreshWaiters;
				this.refreshWaiters = null;
				waiters.forEach(cb => cb());
			})
		},
		
		getPathTo: function(name, cb){
			if(name in this.nameToFileMap){
				var path = this.nameToFileMap[name];
				return setImmediate(() => cb(path))
			}
			
			this.refreshMapping(() => {
				cb(name in this.nameToFileMap? this.nameToFileMap[name]: null)
			});
		}
	};
	
	return FsLoader;

})