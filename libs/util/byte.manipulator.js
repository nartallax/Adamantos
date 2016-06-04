// читалка/писалка бинарных данных в buffer/uint8array
aPackage('nart.util.byte.manipulator', () => {

	var utf8 = aRequire('nart.util.utf8');

	var Manipulator = function(buf, pos){
		if(buf instanceof Manipulator) return buf;
		if(!(this instanceof Manipulator)) return new Manipulator(buf, pos);
		this.b = buf;
		this.pos = pos || 0;
	}
	
	var decodeSign = (i, off) => (((-((i >>> off) & 0x1)) || 1) * (i & ((1 << off) - 1)));
	var encodeSign = (i, off) => i >= 0? i: (-i | (1 << off))
	
	Manipulator.alloc = (size, forceSafe) => {
		var buffer = typeof(Buffer) !== 'undefined'? 
			forceSafe? Buffer.alloc(size): Buffer.allocUnsafe(size):
			new Uint8Array(size);
		
		return new Manipulator(buffer);
	};
	
	Manipulator.prototype = {
		getByte: function(){ return this.b[this.pos++] },
		getSignedByte: function(){ return decodeSign(this.getByte(), 7) },
		getUshort: function(){ return (this.getByte() << 8) | this.getByte() },
		getShort: function(){ return decodeSign(this.getUshort(), 15) },
		getUint: function(){ return (this.getByte() << 24) | (this.getByte() << 16) | (this.getByte() << 8) | this.getByte() },
		getInt: function(){ return decodeSign(this.getUint(), 31) },
		getBytes: function(len){
			var res = this.b.slice(this.pos, this.pos + len);
			this.pos += len;
			return res;
		},
		getString: function(){ 
			var len = this.getUshort(),
				res = utf8.bytesToStr(this.b, this.pos, this.pos + len);
			this.pos += len;
			return res;
		},
		
		putByte: function(b){ this.b[this.pos++] = b & 0xff },
		putSignedByte: function(b){ this.putByte(encodeSign(b, 7)) },
		putUshort: function(u){ this.putByte(u >>> 8), this.putByte(u) },
		putShort: function(u){ this.putUshort(encodeSign(u, 15)) },
		putUint: function(u){ this.putByte(u >>> 24), this.putByte(u >>> 16), this.putByte(u >>> 8), this.putByte(u) },
		putInt: function(u){ this.putUint(encodeSign(u, 31)) },
		putBytes: function(bytes){ bytes.forEach(b => this.putByte(b)) },
		putString: function(str){
			var byteLen = utf8.byteLength(str);
			if(byteLen > 0xffff) throw new Error('String is too long! Max length: 0xffff, got: 0x' + byteLen.toString(16));
			
			this.putUshort(byteLen);
			utf8.strToBytes(str, this.b, this.pos);
			this.pos += byteLen;
		},
		
		// TODO: make it faster by transferring more bytes at once (in ints maybe)
		transferBytes: function(manip, count){
			count = count || manip.bytesToEnd();
			while(count--> 0) this.putByte(manip.getByte())
		},
		
		moveTo: function(n){ this.pos = n },
		advance: function(n){ this.pos += n },
		finished: function(){ return this.pos >= this.b.length },
		bytesToEnd: function(){ return this.b.length - this.pos },
		getBuffer: function(){ return this.b },
		getPosition: function(){ return this.pos }
	};
	
	return Manipulator;

});