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
	
	Manipulator.stringSize = str => {
		var byteLen = utf8.byteLength(str);
		if(byteLen > 0x7fffffff) throw new Error('String is too long! Max length: 0x7fffffff, got: 0x' + byteLen.toString(16));
		return (byteLen <= 0x7f? 1: 4) + byteLen;
	}
	
	Manipulator.fixNeg = num => -num + 0x80000000
	Manipulator.tryFixNeg = num => num < 0? -num + 0x80000000: num
	
	Manipulator.prototype = {
		getByte: function(){ return this.b[this.pos++] },
		getSignedByte: function(){ return decodeSign(this.getByte(), 7) },
		getUshort: function(){ return (this.getByte() << 8) | this.getByte() },
		getShort: function(){ return decodeSign(this.getUshort(), 15) },
		getUint: function(){ return (this.getByte() * 0x1000000) + ((this.getByte() << 16) | (this.getByte() << 8) | this.getByte()) },
		getInt: function(){ return decodeSign(this.getUint(), 31) },
		getUlong: function(){ return (this.getUint() * 0x100000000) + this.getUint() },
		getLong: function(){ 
			var a = this.getInt(), b = this.getUint();
			return (a * 0x100000000) + (a < 0? -b: b);
		},
		getBytes: function(len){
			var res = this.b.slice(this.pos, this.pos + len);
			this.pos += len;
			return res;
		},
		getString: function(){
			var lenFirst = this.getByte(),
				len = lenFirst & 0x80?
					((lenFirst & 0x7f) << 24) | (this.getByte() << 16) | (this.getByte() << 8) | this.getByte():
					lenFirst;
		
			var res = utf8.bytesToStr(this.b, this.pos, this.pos + len);
			this.pos += len;
			return res;
		},
		
		putByte: function(b){ this.b[this.pos++] = b & 0xff },
		putSignedByte: function(b){ this.putByte(encodeSign(b, 7)) },
		putUshort: function(u){ this.putByte(u >>> 8), this.putByte(u) },
		putShort: function(u){ this.putUshort(encodeSign(u, 15)) },
		putUint: function(u){ this.putByte(u >>> 24), this.putByte(u >>> 16), this.putByte(u >>> 8), this.putByte(u) },
		putInt: function(u){ this.putUint(encodeSign(u, 31)) },
		// it's not 'real' (u)long: only 52 bits could be used
		// but it's written using full 8 bytes
		putUlong: function(u){
			this.putUint(~~(u / 0x100000000)), this.putUint(u & 0xffffffff)
		},
		putLong: function(n){
			var neg = n < 0;
			neg && (n = -n);
			this.putInt((~~(n / 0x100000000)) * (neg? -1: 1)), this.putUint(n & 0xffffffff)
		},
		putBytes: function(bytes){ bytes.forEach(b => this.putByte(b)) },
		putString: function(str){
			var byteLen = utf8.byteLength(str);
			if(byteLen > 0x7fffffff) throw new Error('String is too long! Max length: 0x7fffffff, got: 0x' + byteLen.toString(16));
			
			byteLen <= 0x7f? this.putByte(byteLen): this.putUint(byteLen | 0x80000000);
			
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
		getPosition: function(){ return this.pos },

		stringLength: Manipulator.stringSize,
		stringSize: Manipulator.stringSize,
		fixNeg: Manipulator.fixNeg,
		tryFixNeg: Manipulator.tryFixNeg
	};
	
	return Manipulator;

});