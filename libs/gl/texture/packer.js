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
		splitPath = aRequire('nart.util.fs').splitPath,
		err = aRequire('nart.util.err'),
		getPixels = aRequire.node('get-pixels'),
		utf8 = aRequire('nart.util.utf8'),
		Packer = aRequire('nart.gl.resource.packer');

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
		
	var TexturePacker = function(){
		if(!(this instanceof TexturePacker)) return new TexturePacker();
		this.buffers = [];
	}
	
	TexturePacker.prototype = new Packer();
	
	TexturePacker.unpack = bytes => {
		
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
	
	TexturePacker.prototype.getAddeableFilesFilter = () => (/.+\.(jpe?g|gif|png)$/);
	
	TexturePacker.prototype.addBuffer = function(name, buffer, sourceFile){
		getPixels(buffer, 'image/' + (sourceFile.match(/[^.]+$/) || [])[0], err(imageData => {
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
		}));
	};
		
	TexturePacker.prototype.getPackeds = function(cb){
		return Buffer.concat(this.buffers);
	}
	
	return TexturePacker;

});