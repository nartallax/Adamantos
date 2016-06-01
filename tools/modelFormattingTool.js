/*
nartallax@gmail.com

a tool to reformat the OBJ + MTL + texture files to the format expected by the engine
*/

require("../libs/meta/addict.js")
	.addRoot('nart', '../libs')
	.main(() => {
		"use strict";
		
		var ObjReader = aRequire('nart.gl.format.obj.reader'),
			MtlReader = aRequire('nart.gl.format.mtl.reader'),
			
			TexturePacker = aRequire('nart.gl.texture.packer'),
			
			ShapePacker = aRequire('nart.gl.shape.packer'),
			splitPath = aRequire('nart.util.fs').splitPath;
			
		var args = process.argv.slice(2);
		var mode = args.length === 1? 'single_file': 'recursive';
		
		var objToModel = (redundancy, prefix, obj, cb) => {
			var objName = TexturePacker.pathToName(obj);
			var packer = new ShapePacker('test.model.name')
				.setNameResolver(path => {
					var parts = splitPath(path).slice(redundancy);
					parts[parts.length - 1] = parts[parts.length - 1].replace(/\.[^.]+$/, ''); // remove extension
					return parts.join('.');
				})
				.addObj(obj, () => {
					cb && cb(packer.getObject());
				});
		};
		
		switch(mode){
			case 'single_file':
				return objToModel(1, '', args[0], shape => {
					var json = JSON.stringify(shape);
					
					var p = new ShapePacker('test.model.name').addObject(shape).getPacked();
					var p2 = new ShapePacker('test.model.name').addPacked(p).getObject();
					
					console.log(json);
					console.log(JSON.stringify(p2));
				});
			case 'recursive': 
				throw 'Not Implemented';
				return;
			default: throw new Error('Unknown work mode "' + mode + '"');
		}
	});