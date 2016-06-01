// not full-capable, will just drop some attributes
aPackage('nart.gl.format.mtl.reader', () => {

	var readLines = aRequire('nart.util.fs').readLines;

	var MtlReader = {
		read: (path, cb) => {
			var result = {}, // result: texName -> texPath
				currentTex = null;
			
			readLines(path, lines => {
				lines.forEach(l => {
					switch(((l.match(/^\s*(\S+)/) || [])[1] || '').toLowerCase()){
						case 'newmtl': return currentTex = (l.match(/^\s*\S+\s+(.*?)\s*$/) || [])[1];
						case 'map_ka':
							if(!currentTex) return;
							return result[currentTex] = (l.match(/(\S+)\s*$/) || [])[1];
						case 'map_kd': 
							if(!currentTex || (currentTex in result)) return;
							return result[currentTex] = (l.match(/(\S+)\s*$/) || [])[1];
					}
				});
				
				cb(result);
			});
		}
	}
	
	return MtlReader;

});