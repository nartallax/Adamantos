/*
nartallax@gmail.com

a tool to reformat the OBJ + MTL + texture files to the format expected by the engine
usage:
	put OBJ into ../model_sources/na/me/space.obj (MTL and referenced texture files should be nearby)
	launch the tool like 
		node modelFormattingTool.js ../model_sources ../models ../textures na.me.space 	<-- this will 'format' only one model
		node modelFormattingTool.js ../model_sources ../models ../textures				<-- this will 'format' everything inside source dir
		
	'format' = 'translate files to expected format (json) and move them and textures to corresponding locations (to ../models and ../textures)'
*/
	
	
require(__dirname + "/../libs/meta/addict.js")
	.addRoot('nart', __dirname + '/../libs')
	.main(() => {
		"use strict";
		
		var launchTime = new Date().getTime();
		var success = 0, total = 0;
		var onWorkDone = () => {
			console.log('Done in ' + ((new Date().getTime() - launchTime) / 1000).toFixed(2) + 's: ' + success + ' / ' + total);
		}
		
		var Packer = aRequire('nart.gl.resource.packer'),
			TexturePacker = aRequire('nart.gl.texture.packer'),
			ShapePacker = aRequire('nart.gl.shape.packer'),
			ObjReader = aRequire('nart.gl.format.obj.reader'),
			
			Countdown = aRequire('nart.util.countdown'),
			
			splitPath = aRequire('nart.util.fs').splitPath,
			mkDir = aRequire('nart.util.fs').mkDir,
			putFile = aRequire('nart.util.fs').putFile,
			eachFileRecursiveIn = aRequire('nart.util.fs').eachFileRecursiveIn,
			distinct = aRequire('nart.util.collections').distinct,
			
			path = aRequire.node('path'),
			fs = aRequire.node('fs');
			
		var sourceDir = process.argv[2],
			modelDir = process.argv[3],
			textureDir = process.argv[4];

		var pathToName = path => Packer.pathToName(path || '', sourceDir);
			
		if(!sourceDir || !modelDir || !textureDir) return console.error('Expected to have at least 3 arguments: source directory, model destination directory and texture destination directory.');
			
		var redundantPrefixLength = splitPath(sourceDir).length;
			
		var modelList = process.argv.slice(5);
		
		var createAndGetDestinationPath = (file, sourceDir, destDir, cb) => {
			var pathParts = splitPath(destDir).concat(splitPath(file).slice(splitPath(sourceDir).length));
			var resultFile = pathParts.join(path.sep);
			mkDir(pathParts.slice(0, pathParts.length - 1).join(path.sep), () => cb && cb(resultFile));
		}
		
		var transferFile = (file, sourceDir, destDir, cb) => {
			createAndGetDestinationPath(file, sourceDir, destDir, dest => {
				fs.createReadStream(file).pipe(fs.createWriteStream(dest)).on('close', cb || (() => {}));
			});
		}
		
		var transferModel = (obj, cb) => {
			total++;
			ObjReader.readMaterialsWithPaths(obj, matMap => {
				var texturePaths = Object.keys(matMap).map(k => matMap[k]);
				
				if(texturePaths.length === 0) {
					return cb(console.error('Will not process model ' + obj + ': it has no textures at all.'));
				}
				
				var badTextures = texturePaths.filter(f => !f || typeof(f) !== 'string');
				if(badTextures.length > 0){
					return cb(console.error('Will not process model ' + obj + ': ' + badTextures.length + ' of its triangles have no texture.'));
				}
				
				var unsupportedFormatTextures = distinct(texturePaths).filter(f => !f.toLowerCase().endsWith('.gif'));
				if(unsupportedFormatTextures.length > 0){
					return cb(console.error('Will not process model ' + obj + ': ' + unsupportedFormatTextures.length + ' texture images have wrong format (.gif file expected).'));
				}
				
				
				var counter = new Countdown(1, () => (success++, cb && cb()));
				
				
				texturePaths.forEach(p => {
					counter.inc();
					transferFile(p, sourceDir, textureDir, counter.dec);
				});
				
				
				var matNameMap = {};
				Object.keys(matMap).forEach(k => matNameMap[k] = pathToName(matMap[k]));
				
				ObjReader.getSimplifiedObj(obj, matNameMap, text => {
					createAndGetDestinationPath(obj, sourceDir, modelDir, dest => {
						putFile(dest, text, counter.dec);
					});
				});
			});
		};
		
		var nameToPath = (name, sourceDir) => splitPath(sourceDir).concat(name.split('.')).join(path.sep) + '.obj';
		
		var processModels = (paths, done) => {
			
			var i = 0;
			var next = () => {
				var path = paths[i++];
				if(!path) return done && done();
				
				console.log('Processing ' + path);
				
				transferModel(path, next);
			}
			
			next();
			
		}
		
		if(modelList.length === 0){
			console.log('Getting source models list...');
			var files = [];
			eachFileRecursiveIn(sourceDir, file => {
				file.match(/\.[Oo][Bb][Jj]/) && files.push(file)
			}, () => {
				console.log('Found ' + files.length + ' source models.');
				processModels(files, onWorkDone);
			});
		} else {
			processModels(modelList.map(m => nameToPath(m, sourceDir)), onWorkDone);
		}
		
	});