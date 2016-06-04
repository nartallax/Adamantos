aPackage('nart.gl.shape.packer', () => {

	var Packer = aRequire('nart.gl.resource.packer'),
		ObjReader = aRequire('nart.gl.format.obj.reader'),
		utf8 = aRequire('nart.util.utf8'),
		distinct = aRequire('nart.util.collections').distinct;

	var ShapePacker = function(){
		if(!(this instanceof ShapePacker)) return new ShapePacker();
		
		this.models = {};
		this.nameResolver = s => s;
	}
	
	ShapePacker.prototype = new Packer();
	
	ShapePacker.prototype.getSourceFileNameFilter = () => (/.+\.obj$/);
	
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
	
	ShapePacker.prototype.packedToUsable = (reader, len) => {
		var lines = utf8.bytesToStr(reader.getBuffer(), reader.getPosition(), reader.getPosition() + len).split(/[\n\r]+/);
		var triangles = ObjReader.objLinesToTrianglesWithTextureNames(lines);
		
		var primitives = {};
		
		textureNamesOf(triangles).forEach(name => {
			var trs = trianglesWithName(triangles, name);
			
			primitives[name] = {
				vertex: getVertex(trs),
				vertexIndex: getVertexIndex(trs),
				textureIndex: getTextureIndex(trs)
			};
		});
		
		return primitives;
	};
	
	return ShapePacker;

});