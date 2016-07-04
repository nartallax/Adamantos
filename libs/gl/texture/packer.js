// package format: repeated sequences of
// 		string: name
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
		utf8 = aRequire('nart.util.utf8'),
		readGif = aRequire('nart.gl.format.gif.reader'),
		Packer = aRequire('nart.gl.resource.packer');

	var TexturePacker = function(){
		if(!(this instanceof TexturePacker)) return new TexturePacker();
		Packer.call(this);
	}
	
	TexturePacker.prototype = new Packer();
	
	TexturePacker.prototype.getSourceFileNameFilter = () => (/.+\.gif$/);
	
	TexturePacker.prototype.packedToUsable = reader => {
		var buf = reader.getBuffer(),
			pos = reader.getPosition();
			
		return readGif(buf, pos);
	};
	
	return TexturePacker;

});