// абстрактный класс упаковщика каких-нибудь ресурсов
aPackage('nart.gl.resource.packer', () => {
	
	var eachFileRecursiveIn = aRequire('nart.util.fs').eachFileRecursiveIn,
		eachAsync = aRequire('nart.util.collections').eachAsync,
		Path = aRequire.node('path'),
		fs = aRequire.node('fs'),
		splitPath = aRequire('nart.util.fs').splitPath,
		err = aRequire('nart.util.err'),
		utf8 = aRequire('nart.util.utf8');

		
	var Packer = function(){
		if(!(this instanceof Packer)) return new Packer();
	}
	
	Packer.pathToName = (texturePath, prefixPath, prefixName) => {
		texturePath = texturePath.replace(/\.[^.]+$/, '');
		
		// no fake separators allowed
		if(texturePath.indexOf('.') > 0) return null;
		
		var parts = splitPath(texturePath);
		
		if(prefixPath) parts = parts.slice(splitPath(prefixPath).length);
		prefixName = (prefixName || '').split('.').filter(f => f);
		
		return prefixName.concat(parts).join('.');
	};
	
	Packer.prototype = {
		
		getAddeableFilesFilter: () => (/.*/),
		addBuffer: (name, buffer) => {
			throw new Error('Not implemented.');
		},
		
		addDirectories: function(dirPrefixMap, cb){
			if(Array.isArray(dirPrefixMap)){
				var map = {};
				dirPrefixMap.forEach(k => map[k] = '');
				dirPrefixMap = map;
			}
			
			eachAsync(Object.keys(dirPrefixMap), (dirPath, cb) => {
				this.addDirectory(dirPath, dirPrefixMap[dirPath], cb);
			}, cb);
			
			return this;
		},
		
		addDirectory: function(directoryPath, prefix, cb){
			if(!cb && typeof(prefix) === 'function'){
				cb = prefix;
				prefix = '';
			}
			
			var files = [], filter = this.getAddeableFilesFilter();
				
			eachFileRecursiveIn(directoryPath, path => path.toLowerCase().match(filter) && files.push(path), () => {
				eachAsync(files, (file, cb) => {
					var name = Packer.pathToName(file, directoryPath, prefix);
					if(!name) return cb();
					
					fs.readFile(file, err(buffer => {
						this.addBuffer(name, buffer, file);
						cb();
					}));
					
				}, cb);
			});
			
			return this;
		},
		
		getPackeds: function(cb){
			return Buffer.concat(this.buffers);
		}
	};
	
	return Packer;
	
});