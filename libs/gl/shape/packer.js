aPackage('nart.gl.shape.packer', () => {

	var ObjReader = aRequire('nart.gl.format.obj.reader'),
		utf8 = aRequire('nart.util.utf8');

	var Packer = function(){
		if(!(this instanceof Packer)) return new Packer();
		
		this.models = {};
		this.nameResolver = s => s;
	}
	
	Packer.prototype = {
		addObj: function(path, name, cb){
			ObjReader.readWithTexturePaths(path, triangles => ((this.models[name] = triangles), cb()))
		},
		addObject: function(name, obj){
			var triangles = [];
			
			for(var i = 0; i < obj.textures.length; i++){
				var texName = obj.textures[i];
				var shape = obj.shapes[i];
				for(var j = 0; j < shape.vertex.length; j++){
					triangles.push({vertex: shape.vertex[j], texture: shape.texture[j], textureName: texName});
				}
			}
			
			this.models[name] = triangles;
		},
		
		addObjects: function(objMap){
			Object.keys(objMap).forEach(name => this.addObject(name, objMap[name]));
		},
		
		addPacked: function(bytes, pos){
			pos = pos || 0;
			
			var readByte = () => bytes[pos++],
				readShort = () => (readByte() << 8) | readByte(),
				readSignedInt = () => {
					var high = readByte(),
						sign = (high & 0x80)? -1: 1;
						
					high &= 0x7f;
					
					return sign * ((high << 24) | (readByte() << 16) | (readByte() << 8) | readByte());
				},
				
				readBytes = n => {
					var res = bytes.slice(pos, pos + n)
					pos += n
					return res;
				},
				
				readString = () => {
					var len = readShort();
					return utf8.bytesToStr(readBytes(len));
				},
				
				readBounds = () => {
					var min = readSignedInt() / 0xffff,
						max = readSignedInt() / 0xffff;
						
					return {min: min, max: max};
				},
				
				readValue = bounds => (((readShort() * (bounds.max - bounds.min)) + (bounds.min * 0xffff)) / 0xffff),
				
				readVPoint = () => [
					readValue(vXBound),
					readValue(vYBound),
					readValue(vZBound)
				],
				
				readTPoint = () => [readValue(tXBound), readValue(tYBound)],
				
				readTriangle = texName => {
					var v = [], t = [],
						result = { 
						textureName: texName, 
						vertex: v, 
						texture: t
					};
					
					v.push(readVPoint()), t.push(readTPoint());
					v.push(readVPoint()), t.push(readTPoint());
					v.push(readVPoint()), t.push(readTPoint());
					
					return result;
				};
				
			var modelName = readString();
			
			var vXBound = readBounds(), vYBound = readBounds(), vZBound = readBounds(),
				tXBound = readBounds(), tYBound = readBounds(),
				
				texCount = readShort();
			
			var triangles = [];
			
			while(texCount--> 0){
				var texName = readString();
				var triCount = readShort();
				while(triCount--> 0){
					triangles.push(readTriangle(texName));
				}
			}
			
			this.models[modelName] = triangles;
			
			return pos;
		},
		
		addPackeds: function(bytes){
			var pos = 0;
			while(pos < bytes.byteLength){
				pos = addPacked(bytes, pos);
			}
		},
		
		getUniqFieldValues: function(triangles, name){
			var vals = {};
			triangles.forEach(t => vals[t[name]] = true);
			return Object.keys(vals).sort();
		},
		
		getTexturePaths: function(triangles){ return this.getUniqFieldValues(triangles, 'texturePath') },
		getTextureNames: function(triangles){ return this.getUniqFieldValues(triangles, 'textureName') },
		
		setNameResolver: function(res){
			this.nameResolver = res;
			return this;
		},
		
		resolveTextureNames: function(triangles){
			triangles.forEach(t => t.textureName = t.textureName || this.nameResolver(t.texturePath));
			return triangles;
		},
		
		getSimpleModelTriangles: function(triangles){
			var result = [];
			
			this.getTextureNames(triangles).forEach(tex => {
				var v = [], t = [];
				
				triangles
					.filter(tr => tr.textureName === tex)
					.forEach(tr => {
						v.push(tr.vertex);
						t.push(tr.texture);
					});
					
				result.push({vertex: v, texture: t})
			});
			return result;
		},
	
		getObjectByName: function(name){
			var triangles = this.resolveTextureNames(this.models[name]);
			return {
				textures: this.getTextureNames(triangles),
				shapes: this.getSimpleModelTriangles(triangles)
			};
		},
		
		getObjects: function(){
			var result = {};
			Object.keys(this.models).map(name => result[name] = this.getObjectByName(name));
			return result;
		},
		
		// shape format (see below for explaination on coordinates):
		//		2 bytes: name length (count of bytes of utf8)
		//		name_length bytes: name (in utf8)
		//		8 bytes: lowest x vertex coordinate, biggest x vertex coordinate
		//		8 bytes: lowest y vertex coordinate, biggest y vertex coordinate
		//		8 bytes: lowest z vertex coordinate, biggest z vertex coordinate
		//		8 bytes: lowest x texture coordinate, biggest x texture coordinate
		//		8 bytes: lowest y texture coordinate, biggest y texture coordinate
		//		2 bytes: amount of textures used
		//		repeated texture_number times:
		//			2 bytes: size of texture name (count of bytes of utf8)
		//			size_of_texture_name bytes: bytes of texture name in utf8
		//			2 bytes: count of triangles
		//			repeated count_of_triangles * 3:
		//				2 bytes: vertex x coordinate value
		//				2 bytes: vertex y coordinate value
		//				2 bytes: vertex z coordinate value
		//				2 bytes: texture x coordinate value
		//				2 bytes: texture y coordinate value
		//				
		// all vertex and texture coordinate margins (biggest/lowest x/y/z) are stored converted:
		//		multiplied by 0xffff 
		//		rounded to biggest absolute; that is, 0.75 -> 1, -0.75 -> -1
		//		converted to 4-byte signed integer; sign stored just as highest byte and dont invert other bytes (set bit equals negative)
		// all vertex and texture coordinate values are stored converted: 
		//		subtracted by lowest coordinate value for the shape
		//		divided by (biggest - lowest) coordinate value for the shape
		//		multiplied by 0xffff 
		//		converted to 2-byte unsigned integer
		getPackedByName: function(name){
			var triangles = this.models[name],
				object = this.getObjectByName(name),
				
				
				vXBounds = this.getMinMax(triangles, 'vertex', 0),
				vYBounds = this.getMinMax(triangles, 'vertex', 1),
				vZBounds = this.getMinMax(triangles, 'vertex', 2),
				tXBounds = this.getMinMax(triangles, 'texture', 0),
				tYBounds = this.getMinMax(triangles, 'texture', 1),
				
				resultSize = (8 * 5) + 2 + Buffer.byteLength(name, 'utf8') + 2// "header"
					+ object.textures.map(t => Buffer.byteLength(t, "utf8") + 2).reduce((a, b) => a + b, 0) // names
					+ (object.textures.length * 2) // triangle count
					+ (triangles.length * 2 * 5 * 3), // triangles
				
				result = Buffer.allocUnsafe(resultSize),
				pos = 0;
				
			var putByte = b => result.writeUInt8(b & 0xff, pos++),
				putShort = u => (putByte(u >>> 8), putByte(u)),
				putString = s => {
					var len = Buffer.byteLength(s, 'utf8');
					putShort(len);
					result.write(s, pos, len, 'utf8');
					pos += len;
				},
				putSignedInt = i => {
					var neg = i < 0? ((i = -i), true): false;
					putByte((i >>> 24) | (neg? 0x80: 0x00));
					putByte(i >>> 16)
					putByte(i >>> 8)
					putByte(i);
				},
				// returns value of a bound as it could be read
				// needed for more precise encoding of values
				putBoundAndGet = b => { 
					b *= 0xffff;
					b = b < 0? Math.floor(b): Math.ceil(b);
					putSignedInt(b);
					return b / 0xffff;
				},
				putBoundsAndGet = bs => ((bs.min = putBoundAndGet(bs.min)), (bs.max = putBoundAndGet(bs.max)))
				putValue = (v, bounds) => {
					var v = Math.round(((v - bounds.min) * 0xffff) / (bounds.max - bounds.min));
					putShort(v)
				};
				
			putString(name);
			[vXBounds, vYBounds, vZBounds, tXBounds, tYBounds].forEach(putBoundsAndGet);
			putShort(object.textures.length);
			
			for(var texIndex = 0; texIndex < object.textures.length; texIndex++){
				var shape = object.shapes[texIndex];
				
				putString(object.textures[texIndex]);
				putShort(shape.vertex.length);
				
				for(var triangleIndex = 0; triangleIndex < shape.vertex.length; triangleIndex++){
					var vertex = shape.vertex[triangleIndex],
						texture = shape.texture[triangleIndex];
						
					for(var pointIndex = 0; pointIndex < vertex.length; pointIndex++){
						putValue(vertex[pointIndex][0], vXBounds);
						putValue(vertex[pointIndex][1], vYBounds);
						putValue(vertex[pointIndex][2], vZBounds);
						putValue(texture[pointIndex][0], tXBounds);
						putValue(texture[pointIndex][1], tYBounds);
					}
				}
			}
			
			return result;
		},
		
		getPackeds: function(){
			return Buffer.concat(Object.keys(this.models).map(name => this.getPackedByName(name)));
		},
		
		getMinMax: function(triangles, fieldName, index){
			if(triangles.length < 0) return null;
			
			var max, min;
			max = min = triangles[0][fieldName][0][index];
			
			triangles.forEach(tr => tr[fieldName].forEach(fval => {
				var v = fval[index];
				(v > max) && (max = v);
				(v < min) && (min = v);
			}));
			
			return {min: min, max: max};
		}
	}
	
	return Packer;

});