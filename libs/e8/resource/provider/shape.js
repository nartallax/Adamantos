aPackage('nart.e8.resource.provider.shape', () => {
	
	var ObjReader = aRequire('nart.gl.format.obj.reader'),
		utf8 = aRequire('nart.util.utf8'),
		ClientProvider = aRequire('nart.e8.resource.provider.client'),
		eachAsync = aRequire('nart.util.collections').eachAsync,
		SimpleShape = aRequire('nart.gl.shape');
		
	var textureNamesOf = trs => distinct(trs.map(t => t.textureName));
	var trianglesWithName = (trs, name) => trs.filter(t => t.textureName === name);
	
	var eachNestedValue = (trs, field, cb) => {
		trs.forEach(tr => {
			tr[field].forEach(vs => {
				vs.forEach(cb);
			});
		});
	}
	
	var getVertex = trs => {
		var count = 0;
		eachNestedValue(trs, 'vertex', v => count++);
		
		var res = new Float32Array(count),
			pos = 0;
		eachNestedValue(trs, 'vertex', v => res[pos++] = v);
		
		return res;
	}
	
	// TODO: there could be more optimal way of using this; maybe go withoit it? it seems useless
	var getVertexIndex = trs => {
		var count = 0;
		eachNestedValue(trs, 'vertex', v => count++);
		
		var res = new Uint16Array(count);
		for(var i = 0; i < count; i++) res[i] = i;
		
		return res;
	}
	
	var getTextureIndex = trs => {
		var count = 0;
		eachNestedValue(trs, 'texture', v => count++);
		
		var res = new Float32Array(count),
			pos = 0;
		eachNestedValue(trs, 'texture', v => res[pos++] = v);
		
		return res;
	}

		
	var ShapeProvider = ClientProvider.inheritWithChannelAndFabric('core.resource.shape', (dataReader, shapeName, cb) => {
			var lines = utf8.bytesToStr(reader.getBuffer(), reader.getPosition()).split(/[\n\r]+/);
			var triangles = ObjReader.objLinesToTrianglesWithTextureNames(lines);
			var primitives = [];
		
			eachAsync(textureNamesOf(triangles), (textureName, cb) => {
				this.textureProvider.get(textureName, texture => {
					var trs = trianglesWithName(triangles, textureName);
									
					primitives.push({
						vertex: getVertex(trs),
						vertexIndex: getVertexIndex(trs),
						textureIndex: getTextureIndex(trs),
						texture: texture
					});
					
					cb();
				});
			}, () => cb(new SimpleShape(this.gl, shapeName, primitives)));
		}, function(cacheTimeout, messenger, gl, textureProvider){
			this.gl = gl;
			this.textureProvider = textureProvider;
		});
	
	return ShapeProvider;
	
})