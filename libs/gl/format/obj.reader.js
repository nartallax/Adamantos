// not full-capable, will just drop some attributes
aPackage('nart.gl.format.obj.reader', () => {
	
	var readLines = aRequire('nart.util.fs').readLines,
		MtlReader = aRequire('nart.gl.format.mtl.reader'),
		mapAsync = aRequire('nart.util.collections').mapAsync,
		path = aRequire.node('path');
	
	ObjReader = {
		resolvePathByObj: (obj, subpath) => {
			var p = obj.split(/[\\\/]/);
			p.pop();
			p = p.concat(subpath.split(/[\\\/]/));
			return path.join.apply(path, p);
		},
		read: (path, cb) => {
			var result = {
				mtl: [], // paths to mtl files
				triangles: [] // { vertex: [[1, 1, 1] x3 ], texture: [[1, 1] x3 ], material: 'name'}
			};
			
			var vertex = [], texture = [], material = null,
				indexByNum = (arr, num) => (num > 0? num - 1: arr.length + num),
				vertexByNum = num => vertex[indexByNum(vertex, num)],
				textureByNum = num => texture[indexByNum(texture, num)],
				triangleBy = (va, vb, vc, ta, tb, tc) => {
					result.triangles.push({
						vertex: [vertexByNum(va), vertexByNum(vb), vertexByNum(vc)],
						texture: [textureByNum(ta), textureByNum(tb), textureByNum(tc)],
						material: material
					});
				}
			
			readLines(path, lines => {
				lines.forEach(l => {
					var p = l.replace(/(^\s+|\s+$)/g, '').split(/\s+/);
					if(p.length < 1) return;
					switch((p[0] || '').toLowerCase()){
						case 'mtllib':
							return result.mtl.push(ObjReader.resolvePathByObj(path, p[1]));
						case 'usemtl':
							return material = p[1];
						case 'v':
							p = p.slice(1, 4).map(s => parseFloat(s)).filter(s => !Number.isNaN(s));
							if(p.length < 3) return;
							vertex.push(p);
							return;
						case 'vt':
							p = p.slice(1, 3).map(s => parseFloat(s)).filter(s => !Number.isNaN(s));
							if(p.length < 2) return;
							texture.push(p);
							return;
						case 'f': //самое интересное!
							var nums = p.slice(1)
								.map(s => s.split('/').map(s => parseInt(s)).filter(n => !Number.isNaN(n)))
								.filter(a => a.length > 0);
								
							if(nums.length < 3) return;
							
							for(var i = 2; i < nums.length; i++){
								var a = nums[i - 2], b = nums[i - 1], c = nums[i];
								triangleBy(a[0], b[0], c[0], a[1], b[1], c[1]);
							}
							return;
					}
				});
				
				cb(result);
			})
		},
		
		readWithTexturePaths: (path, cb) => {
			ObjReader.read(path, data => {
				mapAsync(data.mtl, (mtl, cb) => MtlReader.read(mtl, cb), matMaps => {
					var matMap = {};
					
					matMaps.forEach(mmap => {
						for(var i in mmap) matMap[i] = ObjReader.resolvePathByObj(path, mmap[i]);
					});
					
					data.triangles.forEach(t => t.texturePath = matMap[t.material]);
					
					cb(data.triangles);
				});
			});
		}
	}
	
	return ObjReader;
	
});