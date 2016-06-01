// package format: repeated sequences of
// 		2 byte: byte length of string containing path to texture
//		2 byte: frame count
//		2 byte: width
//		2 byte: height
//		string containing texture name (name = lowercased path with dots instead of slashes and without extension)
//		texture bytes: sequence of 4-byte couples: r, g, b, a, line after line, frame after frame
aPackage('nart.gl.texture.packer', () => {

	var eachFileRecursiveIn = aRequire('nart.util.fs').eachFileRecursiveIn,
		eachAsync = aRequire('nart.util.collections').eachAsync,
		Path = aRequire.node('path'),
		fs = aRequire.node('fs'),
		err = aRequire('nart.util.err'),
		getPixels = aRequire.node('get-pixels'),
		utf8 = aRequire('nart.util.utf8'),
		zlib = aRequire.node('zlib');

		// this also purifies path, removing redundant elements
	var splitPath = path => Path.join.apply(Path, path.split(Path.sep)).split(Path.sep);
	var getFrameCount = ndarr => ndarr.shape.length === 3? 1: ndarr.shape[0];
	var getFrameSize = ndarr => {
		var off = ndarr.shape.length - 3;
		return {width: ndarr.shape[off], height: ndarr.shape[off + 1]};
	}
	var frameToBuffer = (d, f) => {
		var size = getFrameSize(d),
			result = new Buffer.allocUnsafe(size.width * size.height * 4), 
			i = 0;
		
		if(d.shape.length === 4){ // loop optimization
			for(var y = 0; y < size.height; y++)
				for(var x = 0; x < size.width; x++){
					result.writeUInt8(d.get(f, x, y, 0), i++);
					result.writeUInt8(d.get(f, x, y, 1), i++);
					result.writeUInt8(d.get(f, x, y, 2), i++);
					result.writeUInt8(d.get(f, x, y, 3), i++);
				}
		} else {
			for(var y = 0; y < size.height; y++)
				for(var x = 0; x < size.width; x++){
					result.writeUInt8(d.get(x, y, 0), i++);
					result.writeUInt8(d.get(x, y, 1), i++);
					result.writeUInt8(d.get(x, y, 2), i++);
					result.writeUInt8(d.get(x, y, 3), i++);
				}
		}
		
		return result;
	}
		
	var Packer = function(separator){
		if(!(this instanceof Packer)) return new Packer();
		this.buffers = [];
		this.separator = separator || '.';
	}
	
	Packer.unpack = bytes => {
		
		var off = 0,
			len = bytes.byteLength,
			result = {};
		
		var readShort = () => { 
			var res = ((bytes[off] << 8) | bytes[off + 1]);
			off += 2;
			return res;
		}
		
		var extractBytes = n => {
			var res = bytes.slice(off, off + n)
			off += n;
			return res;
		}
		
		var readTexture = () => {
			var nameLen = readShort(),
				frameCount = readShort(),
				w = readShort(),
				h = readShort(),
				frameSize = w * h * 4;
				
			var name = utf8.bytesToStr(extractBytes(nameLen));
			
			var frames = [];
			for(var i = 0; i < frameCount; i++) frames.push(extractBytes(frameSize));
				
			result[name] = {width: w, height: h, frames: frames};
		}
		
		while(off < len) readTexture();
		
		return result;
		
	}
	
	Packer.prototype = {
		
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
			
			var texPaths = [];
				
			eachFileRecursiveIn(directoryPath, path => texPaths.push(path), () => {
				eachAsync(texPaths, (texPath, cb) => {
					var name = this.texturePathToName(texPath, directoryPath, prefix);
					if(!name) return cb();
					
					getPixels(texPath, err(imageData => {
						if(!imageData) return;
						
						var frameSize = getFrameSize(imageData),
							frameCount = getFrameCount(imageData),
							nameByteLen = Buffer.byteLength(name, "utf8"),
							metaBuffer = Buffer.allocUnsafe(2 + 2 + 2 + 2 + nameByteLen),
						
							i = 0,
							putByte = val => metaBuffer.writeUInt8(val & 0xff, i++),
							putShort = val => { putByte(val >>> 8), putByte(val) };
						
						putShort(nameByteLen);
						putShort(frameCount);
						putShort(frameSize.width);
						putShort(frameSize.height);
						metaBuffer.write(name, i, nameByteLen, 'utf8');
						
						var frameBufs = [];
						for(var f = 0; f < frameCount; f++) frameBufs.push(frameToBuffer(imageData, f));
						
						//console.log('Wrote ' + name + ': ' + (metaBuffer.length + frameBufs.reduce((n, b) => n + b.length, 0)) + ' bytes')
						
						this.buffers.push(metaBuffer);
						this.buffers = this.buffers.concat(frameBufs);
						
						cb();
						
					}));
					
				}, cb);
			});
			
			return this;
		},
		
		isSupportedTexture: function(path){
			return path.toLowerCase().match(/.+\.(jpe?g|gif|png)$/)? true: false;
		},
		
		texturePathToName: function(texturePath, prefixPath, prefixName){
			// limited set of image types supported
			if(!this.isSupportedTexture(texturePath)) return null;
			
			texturePath = texturePath.replace(/\.[^.]+$/, '');
			
			// no fake separators allowed
			if(texturePath.indexOf(this.separator) > 0) return null;
			
			var parts = splitPath(texturePath);
			
			if(prefixPath) parts = parts.slice(splitPath(prefixPath).length);
			prefixName = (prefixName || '').split(this.separator).filter(f => f);
			
			return prefixName.concat(parts).join(this.separator);
		},
		
		getBuffer: function(cb){
			cb(Buffer.concat(this.buffers));
			return this;
		},
		
		getGzippedBuffer: function(cb){
			zlib.gzip(Buffer.concat(this.buffers), {
				chunkSize: 16 * 1024,
				memLevel: 9,
				level: zlib.Z_BEST_COMPRESSION,
				strategy: zlib.Z_FIXED
			}, err(cb));
			return this;
		}
		
		
	};
	
	Packer.texturePathToName = Packer.pathToName = Packer.prototype.texturePathToName;
	Packer.isSupportedTexture = Packer.prototype.isSupportedTexture;
	
	return Packer;

});