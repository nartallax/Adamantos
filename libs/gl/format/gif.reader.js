/*
GIF file reader. 
reworked and Addict-packed 

original: (c) Dean McNamee dean@gmail.com, 2013
https://www.npmjs.com/package/omggif
https://github.com/deanm/omggif
*/
aPackage('nart.gl.format.gif.reader', () => {

	var utf8 = aRequire('nart.util.utf8');

	// each frame is a sequence of horisontal lines of RGB pixels
	function parseBuffer(data, cb) {
		var reader = new GifReader(data);
		
		var result = {width: reader.width, height: reader.height, frames: []};
		
		var frameCount = reader.numFrames() || 1;
		
		for(var frameNum = 0; frameNum < frameCount; frameNum++){
			var frame = new Uint8Array(reader.width * reader.height * 4);
			
			reader.decodeAndBlitFrameRGBA(frameNum, frame);
			result.frames.push(frame);
		}
		
		return result;
	}
	
	var BufReader = function(buf){
		this.b = buf;
		this.pos = 0;
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
		
		advance: function(n){ this.pos += n }
	}
	
	var checkMagicNumber = reader => {
		var header = reader.readString(6);
		if(header !== 'GIF89a' && header !== 'GIF87a'){
			throw new Error('Invalid GIF magic number: ' + header);
		}
	}
	
	var readHeader = reader => {
		var result = {},
			globalPaletteDesc = reader.readByte();	
			
		result.width = reader.readShort();
		result.height = reader.readShort();
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
	
	var controlExtensionReaders = {
		
	};
	
	var blockReaders = {
		0x21: reader => { // graphics control extensions
		},
		0x2c: reader => {
		},
	};
	
	function GifReader(buf) {
		var p = 0;

		var reader = new BufReader(buf);

		checkMagicNumber(reader);
		
		var header = readHeader(reader),
			frames = [];
		
		if(header.isGlobalPalette) reader.advance(header.globalColorsCount * 3);
		
		p = reader.pos;

		
		
		var no_eof = true;

		var frames = [ ];

		var delay = 0;
		var transparent_index = null;
		var disposal = 0;	// 0 - No disposal specified.
		var loop_count = null;

		var width = this.width = header.width;
		var height = this.height = header.height;

		while (no_eof && p < buf.length) {
			switch (buf[p++]) {
				case 0x21:	// Graphics Control Extension Block
					switch (buf[p++]) {
						case 0xff:	// Application specific block
							// Try if it's a Netscape block (with animation loop counter).
							if (buf[p	 ] !== 0x0b ||	// 21 FF already read, check block size.
									// NETSCAPE2.0
									buf[p+1 ] == 0x4e && buf[p+2 ] == 0x45 && buf[p+3 ] == 0x54 &&
									buf[p+4 ] == 0x53 && buf[p+5 ] == 0x43 && buf[p+6 ] == 0x41 &&
									buf[p+7 ] == 0x50 && buf[p+8 ] == 0x45 && buf[p+9 ] == 0x32 &&
									buf[p+10] == 0x2e && buf[p+11] == 0x30 &&
									// Sub-block
									buf[p+12] == 0x03 && buf[p+13] == 0x01 && buf[p+16] == 0) {
								p += 14;
								loop_count = buf[p++] | buf[p++] << 8;
								p++;	// Skip terminator.
							} else {	// We don't know what it is, just try to get past it.
								p += 12;
								while (true) {	// Seek through subblocks.
									var block_size = buf[p++];
									if (block_size === 0) break;
									p += block_size;
								}
							}
							break;

						case 0xf9:	// Graphics Control Extension
							if (buf[p++] !== 0x4 || buf[p+4] !== 0)
								throw "Invalid graphics extension block.";
							var pf1 = buf[p++];
							delay = buf[p++] | buf[p++] << 8;
							transparent_index = buf[p++];
							if ((pf1 & 1) === 0) transparent_index = null;
							disposal = pf1 >> 2 & 0x7;
							p++;	// Skip terminator.
							break;

						case 0xfe:	// Comment Extension.
							while (true) {	// Seek through subblocks.
								var block_size = buf[p++];
								if (block_size === 0) break;
								// console.log(buf.slice(p, p+block_size).toString('ascii'));
								p += block_size;
							}
							break;

						default:
							throw "Unknown graphic control label: 0x" + buf[p-1].toString(16);
					}
					break;

				case 0x2c:	// Image Descriptor.
					var x = buf[p++] | buf[p++] << 8;
					var y = buf[p++] | buf[p++] << 8;
					var w = buf[p++] | buf[p++] << 8;
					var h = buf[p++] | buf[p++] << 8;
					var pf2 = buf[p++];
					var local_palette_flag = pf2 >> 7;
					var interlace_flag = pf2 >> 6 & 1;
					var num_local_colors_pow2 = pf2 & 0x7;
					var num_local_colors = 1 << (num_local_colors_pow2 + 1);
					var palette_offset = header.globalPaletteOffset;
					var has_local_palette = false;
					if (local_palette_flag) {
						var has_local_palette = true;
						palette_offset = p;	// Override with local palette.
						p += num_local_colors * 3;	// Seek past palette.
					}

					var data_offset = p;

					p++;	// codesize
					while (true) {
						var block_size = buf[p++];
						if (block_size === 0) break;
						p += block_size;
					}

					frames.push({x: x, y: y, width: w, height: h,
											 has_local_palette: has_local_palette,
											 palette_offset: palette_offset,
											 data_offset: data_offset,
											 data_length: p - data_offset,
											 transparent_index: transparent_index,
											 interlaced: !!interlace_flag,
											 delay: delay,
											 disposal: disposal});
					break;

				case 0x3b:	// Trailer Marker (end of file).
					no_eof = false;
					break;

				default:
					throw "Unknown gif block: 0x" + buf[p-1].toString(16);
					break;
			}
		}

		this.numFrames = function() {
			return frames.length;
		};

		this.loopCount = function() {
			return loop_count;
		};

		this.frameInfo = function(frame_num) {
			if (frame_num < 0 || frame_num >= frames.length)
				throw "Frame index out of range.";
			return frames[frame_num];
		}

		this.decodeAndBlitFrameRGBA = function(frame_num, pixels) {
			var frame = this.frameInfo(frame_num);
			var num_pixels = frame.width * frame.height;
			var index_stream = new Uint8Array(num_pixels);	// At most 8-bit indices.
			GifReaderLZWOutputIndexStream(
					buf, frame.data_offset, index_stream, num_pixels);
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
		};
	}

	function GifReaderLZWOutputIndexStream(code_stream, p, output, output_length) {
		var min_code_size = code_stream[p++];

		var clear_code = 1 << min_code_size;
		var eoi_code = clear_code + 1;
		var next_code = eoi_code + 1;

		var cur_code_size = min_code_size + 1;	// Number of bits per code.
		// NOTE: This shares the same name as the encoder, but has a different
		// meaning here.	Here this masks each code coming from the code stream.
		var code_mask = (1 << cur_code_size) - 1;
		var cur_shift = 0;
		var cur = 0;

		var op = 0;	// Output pointer.
		
		var subblock_size = code_stream[p++];

		// TODO(deanm): Would using a TypedArray be any faster?	At least it would
		// solve the fast mode / backing store uncertainty.
		// var code_table = Array(4096);
		var code_table = new Int32Array(4096);	// Can be signed, we only use 20 bits.

		var prev_code = null;	// Track code-1.

		while (true) {
			// Read up to two bytes, making sure we always 12-bits for max sized code.
			while (cur_shift < 16) {
				if (subblock_size === 0) break;	// No more data to be read.

				cur |= code_stream[p++] << cur_shift;
				cur_shift += 8;

				if (subblock_size === 1) {	// Never let it get to 0 to hold logic above.
					subblock_size = code_stream[p++];	// Next subblock.
				} else {
					--subblock_size;
				}
			}

			// TODO(deanm): We should never really get here, we should have received
			// and EOI.
			if (cur_shift < cur_code_size)
				break;

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
			if (op_end > output_length) {
				console.log("Warning, gif stream longer than expected.");
				return;
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

		if (op !== output_length) {
			console.log("Warning, gif stream shorter than expected.");
		}

		return output;
	}

	return parseBuffer;

});