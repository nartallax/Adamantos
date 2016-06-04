/*
GIF file reader. 
reworked and Addict-packed 
simplified: some parameters are just ignored (disposal, interframe delay)

original: (c) Dean McNamee dean@gmail.com, 2013
https://www.npmjs.com/package/omggif
https://github.com/deanm/omggif
*/
aPackage('nart.gl.format.gif.reader', () => {
	'use strict';
	
	var utf8 = aRequire('nart.util.utf8');

	// each frame is a sequence of horisontal lines of RGB pixels
	function parseBuffer(data, offset){
		var reader = new GifReader(data, offset);
		
		var result = {width: reader.width, height: reader.height, frames: []};
		
		var frame = new Uint8Array(reader.width * reader.height * 4);
		for(var frameNum = 0; frameNum < reader.frames.length; frameNum++){
			result.frames.push(frame = reader.decodeAndBlitFrameRGBA(reader.frames[frameNum], frame));
		}
		
		return result;
	}
	
	var BufReader = function(buf, pos){
		this.b = buf;
		this.pos = pos || 0;
	}
	
	BufReader.prototype = {
		canRead: function(){ return this.pos < this.b.length },
		
		readBytes: function(n){
			var res = this.b.slice(this.pos, this.pos + n)
			this.pos += n;
			return res;
		},
		
		readString: function(n){ return utf8.bytesToStr(this.readBytes(n)) },
		
		readByte: function(){ return this.b[this.pos++] },
		readShort: function(){ return this.readByte() | (this.readByte() << 8) },
		skipByteSizedBlocks: function(){
			var blockSize;
			do {
				this.advance(blockSize = this.readByte());
			} while(blockSize !== 0);
		},
		
		advance: function(n){ this.pos += n }
	}
	
	var checkMagicNumber = reader => {
		var header = reader.readString(6);
		if(header !== 'GIF89a' && header !== 'GIF87a'){
			throw new Error('Invalid GIF magic number: ' + header);
		}
	}
	
	var readHeader = reader => {
		var result = {};
			
		result.width = reader.readShort();
		result.height = reader.readShort();
		
		var globalPaletteDesc = reader.readByte();
		
		result.backgroundColorIndex = reader.readByte();
		result.pixelAspectRatio = reader.readByte();
		result.globalPaletteOffset = reader.pos;
		result.isGlobalPalette = (globalPaletteDesc >> 0x7)? true: false;
		result.globalColorsCount = 1 << ((globalPaletteDesc & 0x7) + 1);
		
		return result;
	}
	
	var eachBlock = (reader, cb) => {
		while(reader.canRead()){
			var blockCode = reader.readByte();
			if(blockCode === 0x3b) return; // EOF
			cb(blockCode);
		}
	}
	
	var readExtensionBlockInto = (reader, params) => {
		var extensionId = reader.readByte();
		switch(extensionId){
			case 0xfe: // comment block (ascii btw)
			case 0xff: // application specific extension
				return reader.skipByteSizedBlocks();
				
			case 0xf9:	// control extension
				var len = reader.readByte();
				if(len !== 4) throw new Error('Invalid control block length: ' + len + ' (expected: 4)');
				
				var blockDesc = reader.readByte();
				params.disposal = (blockDesc >> 2) & 0x7;
				
				reader.readShort(); // animation delay, unused
				
				params.transparentIndex = reader.readByte();
				var haveTransparentColor = (blockDesc & 0x1)? true: false;
				haveTransparentColor || (params.transparentIndex = null);
				
				var terminator = reader.readByte();
				if(terminator !== 0) throw new Error('Invalid control block terminator: ' + terminator + ' (expected: 0)');
				return;

			default:
				throw new Error('Unknown extension block ID: 0x' + extensionId.toString(16));
		}
	};
	
	var readFrameBlockWith = (reader, params) => {
		var x = reader.readShort(),
			y = reader.readShort(),
			w = reader.readShort(),
			h = reader.readShort(),
			pf2 = reader.readByte();
		
		var haveLocalPalette = pf2 >> 7? true: false,
			haveInterlace = (pf2 >> 6) & 1? true: false,
			localPaletteSize = haveLocalPalette? 1 << ((pf2 & 0x7) + 1): 0,
			paletteOffset = haveLocalPalette? reader.pos: params.globalPaletteOffset;
		
		reader.advance(localPaletteSize * 3);
		
		var dataOffset = reader.pos;
		
		reader.readByte(); // codesize
		reader.skipByteSizedBlocks();
		
		return {x: x, y: y, width: w, height: h, totalWidth: params.width, totalHeight: params.height,
				 palette_offset: paletteOffset,
				 data_offset: dataOffset,
				 transparent_index: params.transparentIndex,
				 interlaced: haveInterlace};
	};
	
	var decodeIndexStreamInto = (reader, output) => {
		var min_code_size = reader.readByte();

		var clear_code = 1 << min_code_size;
		var eoi_code = clear_code + 1;
		var next_code = eoi_code + 1;

		var cur_code_size = min_code_size + 1;	// Number of bits per code
		var code_mask = (1 << cur_code_size) - 1; // this masks each code coming from the code stream.
		var cur_shift = 0;
		var cur = 0;

		var op = 0;	// Output pointer.
		
		var subblock_size = reader.readByte();

		// TODO(deanm): Would using a TypedArray be any faster?	At least it would
		// solve the fast mode / backing store uncertainty.
		// var code_table = Array(4096);
		var code_table = new Int32Array(4096);	// Can be signed, we only use 20 bits.

		var prev_code = null;	// Track code-1.

		while (true) {
			// Read up to two bytes, making sure we always 12-bits for max sized code.
			while (cur_shift < 16) {
				if (subblock_size === 0) break;	// No more data to be read.

				cur |= reader.readByte() << cur_shift;
				cur_shift += 8;

				if (subblock_size === 1) {	// Never let it get to 0 to hold logic above.
					subblock_size = reader.readByte();	// Next subblock.
				} else {
					--subblock_size;
				}
			}

			// TODO(deanm): We should never really get here, we should have received
			// and EOI.
			if (cur_shift < cur_code_size){
				throw new Error('Error reading GIF image code stream: probably incorrect LZW stream (cur_shift < cur_code_size)');
			}

			var code = cur & code_mask;
			cur >>= cur_code_size;
			cur_shift -= cur_code_size;

			// TODO(deanm): Maybe should check that the first code was a clear code,
			// at least this is what you're supposed to do.	But actually our encoder
			// now doesn't emit a clear code first anyway.
			if (code === clear_code) {
				// We don't actually have to clear the table.	This could be a good idea
				// for greater error checking, but we don't really do any anyway.	We
				// will just track it with next_code and overwrite old entries.

				next_code = eoi_code + 1;
				cur_code_size = min_code_size + 1;
				code_mask = (1 << cur_code_size) - 1;

				// Don't update prev_code ?
				prev_code = null;
				continue;
			} else if (code === eoi_code) {
				break;
			}

			// We have a similar situation as the decoder, where we want to store
			// variable length entries (code table entries), but we want to do in a
			// faster manner than an array of arrays.	The code below stores sort of a
			// linked list within the code table, and then "chases" through it to
			// construct the dictionary entries.	When a new entry is created, just the
			// last byte is stored, and the rest (prefix) of the entry is only
			// referenced by its table entry.	Then the code chases through the
			// prefixes until it reaches a single byte code.	We have to chase twice,
			// first to compute the length, and then to actually copy the data to the
			// output (backwards, since we know the length).	The alternative would be
			// storing something in an intermediate stack, but that doesn't make any
			// more sense.	I implemented an approach where it also stored the length
			// in the code table, although it's a bit tricky because you run out of
			// bits (12 + 12 + 8), but I didn't measure much improvements (the table
			// entries are generally not the long).	Even when I created benchmarks for
			// very long table entries the complexity did not seem worth it.
			// The code table stores the prefix entry in 12 bits and then the suffix
			// byte in 8 bits, so each entry is 20 bits.

			var chase_code = code < next_code ? code : prev_code;

			// Chase what we will output, either {CODE} or {CODE-1}.
			var chase_length = 0;
			var chase = chase_code;
			while (chase > clear_code) {
				chase = code_table[chase] >> 8;
				++chase_length;
			}

			var k = chase;
			
			var op_end = op + chase_length + (chase_code !== code ? 1 : 0);
			if (op_end > output.length) {
				throw new Error('Error reading GIF image code stream: its length is smaller (' + op_end + ') than expected ' + output.length + ' bytes.');
			}

			// Already have the first byte from the chase, might as well write it fast.
			output[op++] = k;

			op += chase_length;
			var b = op;	// Track pointer, writing backwards.

			if (chase_code !== code)	// The case of emitting {CODE-1} + k.
				output[op++] = k;

			chase = chase_code;
			while (chase_length--) {
				chase = code_table[chase];
				output[--b] = chase & 0xff;	// Write backwards.
				chase >>= 8;	// Pull down to the prefix code.
			}

			if (prev_code !== null && next_code < 4096) {
				code_table[next_code++] = prev_code << 8 | k;
				// TODO(deanm): Figure out this clearing vs code growth logic better.	I
				// have an feeling that it should just happen somewhere else, for now it
				// is awkward between when we grow past the max and then hit a clear code.
				// For now just check if we hit the max 12-bits (then a clear code should
				// follow, also of course encoded in 12-bits).
				if (next_code >= code_mask+1 && cur_code_size < 12) {
					++cur_code_size;
					code_mask = code_mask << 1 | 1;
				}
			}

			prev_code = code;
		}

		if (op !== output.length) {
			throw new Error('Error reading GIF image code stream: its length is smaller (' + op_end + ') than expected ' + output.length + ' bytes.');
		}

		return output;
	}
	
	function GifReader(buf, offset) {
		var p = 0;

		var reader = new BufReader(buf, offset || 0);

		checkMagicNumber(reader);
		
		var header = readHeader(reader),
			frames = [],
			params = {};
			
		this.frames = frames;
		
		if(header.isGlobalPalette) reader.advance(header.globalColorsCount * 3);
		
		var width = this.width = header.width;
		var height = this.height = header.height;

		eachBlock(reader, blockCode => {
			switch(blockCode){
				case 0x21: return readExtensionBlockInto(reader, header);
				case 0x2c: return frames.push(readFrameBlockWith(reader, header));
				default: throw new Error('Unknown GIF block code: 0x' + blockCode.toString(16));
			}
		});
		
		
		//return {width: header.width, height: header.height, frames: frames};
		
		this.decodeAndBlitFrameRGBA = function(frame, baseFrame) {
			var num_pixels = frame.width * frame.height;
			var index_stream = new Uint8Array(num_pixels);	// At most 8-bit indices.
			var pixels = baseFrame.slice(0);//new Uint8Array(frame.totalWidth * frame.totalHeight * 4);
			
			decodeIndexStreamInto(new BufReader(buf, frame.data_offset), index_stream);
			
			var palette_offset = frame.palette_offset;

			// NOTE(deanm): It seems to be much faster to compare index to 256 than
			// to === null.	Not sure why, but CompareStub_EQ_STRICT shows up high in
			// the profile, not sure if it's related to using a Uint8Array.
			var trans = frame.transparent_index;
			if (trans === null) trans = 256;

			// We are possibly just blitting to a portion of the entire frame.
			// That is a subrect within the framerect, so the additional pixels
			// must be skipped over after we finished a scanline.
			var framewidth	= frame.width;
			var framestride = width - framewidth;
			var xleft			 = framewidth;	// Number of subrect pixels left in scanline.

			// Output indicies of the top left and bottom right corners of the subrect.
			var opbeg = ((frame.y * width) + frame.x) * 4;
			var opend = ((frame.y + frame.height) * width + frame.x) * 4;
			var op		= opbeg;

			var scanstride = framestride * 4;

			// Use scanstride to skip past the rows when interlacing.	This is skipping
			// 7 rows for the first two passes, then 3 then 1.
			if (frame.interlaced === true) {
				scanstride += width * 4 * 7;	// Pass 1.
			}

			var interlaceskip = 8;	// Tracking the row interval in the current pass.

			for (var i = 0, il = index_stream.length; i < il; ++i) {
				var index = index_stream[i];

				if (xleft === 0) {	// Beginning of new scan line
					op += scanstride;
					xleft = framewidth;
					if (op >= opend) { // Catch the wrap to switch passes when interlacing.
						scanstride = framestride * 4 + width * 4 * (interlaceskip-1);
						// interlaceskip / 2 * 4 is interlaceskip << 1.
						op = opbeg + (framewidth + framestride) * (interlaceskip << 1);
						interlaceskip >>= 1;
					}
				}

				if (index === trans) {
					op += 4;
				} else {
					var r = buf[palette_offset + index * 3];
					var g = buf[palette_offset + index * 3 + 1];
					var b = buf[palette_offset + index * 3 + 2];
					pixels[op++] = r;
					pixels[op++] = g;
					pixels[op++] = b;
					pixels[op++] = 255;
				}
				--xleft;
			}
			
			return pixels;
		};
	}

	return parseBuffer;
	
});