/*
nartallax@gmail.com

a tool to reformat the OBJ + MTL + texture files to the format expected by the engine and move to expected directories
usage:
	0 (optional). create directories with source files.
		textures (.gif files) and shapes (.obj files) should be stored separately.
		files should be placed according to desired name, i.e. shape some.shape should be placed in shape_source_dir/some/shape.obj
	1. make sure tool is configured as expected: see toolConfig.json
		all the paths you created/discovered on previous step should be in the config
		you may want to store your shapes/textures in multiple directories
		in that case you should create multiple 'operations' in tool section
		if some directory is not mentioned in 'operation' definition, it will have default value (mentioned in 'directories' section)
	2. launch the tool (node tools/shapeMovingTool.js)
	
	notes: 
	1. materials' names in .obj files should refer to some texture. 
		these texture also should exist in texture source folder.
		actual texture file used in .obj doesnt matter at all.
	2. tool takes data from 'raw' directories and put it into 'source' directories
*/
	
	
require(__dirname + "/../libs/meta/addict.js")
	.addRoot('nart', __dirname + '/../libs')
	.addRoot('nart.adamantos.tools', __dirname)
	.main(() => {
		"use strict";
		
		var launchTime = new Date().getTime();
		var success = 0, total = 0;
		var onWorkDone = () => {
			console.log('Done in ' + ((new Date().getTime() - launchTime) / 1000).toFixed(2) + 's: ' + success + ' / ' + total);
		}
		
		var Packer = aRequire('nart.gl.resource.packer'),
			ObjReader = aRequire('nart.gl.format.obj.reader'),
			
			Countdown = aRequire('nart.util.countdown'),
			
			splitPath = aRequire('nart.util.fs').splitPath,
			mkDir = aRequire('nart.util.fs').mkDir,
			putFile = aRequire('nart.util.fs').putFile,
			eachFileRecursiveIn = aRequire('nart.util.fs').eachFileRecursiveIn,
			readGif = aRequire('nart.gl.format.gif.reader'),
			
			path = aRequire.node('path'),
			fs = aRequire.node('fs'),
			
			//config = eval('(' + fs.readFileSync(__dirname + '/toolConfig.json', 'utf8') + ')');
			config = aRequire('nart.adamantos.tools.config');
			
		var nameToPath = (name, sourceDir) => splitPath(sourceDir).concat(name.split('.')).join(path.sep) + '.obj';
			
		var createAndGetDestinationPath = (file, sourceDir, destDir, cb) => {
			var pathParts = splitPath(destDir).concat(splitPath(file).slice(splitPath(sourceDir).length));
			var resultFile = pathParts.join(path.sep);
			mkDir(pathParts.slice(0, pathParts.length - 1).join(path.sep), () => cb && cb(resultFile));
		}
		
		var copyFile = (source, destination, cb) => {
			fs.createReadStream(source).pipe(fs.createWriteStream(destination)).on('close', cb || (() => {}));
		}
		
		var transferFile = (file, sourceDir, destDir, cb) => {
			createAndGetDestinationPath(file, sourceDir, destDir, dest => {
				copyFile(file, dest, cb);
			});
		}
			
		var isCorrectGif = (path, cb) => {
			fs.readFile(path, (e, buf) => {
				if(e){
					console.log('Error reading texture ' + path + ': ' + e.message);
					return cb(false);
				}
				
				try {
					readGif(buf);
				} catch(e){
					console.log('Error reading texture ' + path + ': ' + e.message);
					return cb(false);
				}
				return cb(true);
			});
		};
			
		var runFor = (texBase, shapeBase, texDest, shapeDest, onOperationCompleted) => {
			var fixTexName = name => name.replace("_", ".");
			var texNameToPath = name => splitPath(texBase).concat(fixTexName(name).split(".")).join(path.sep) + '.gif';
			
			var transferModel = (obj, cb) => {
				total++;
				ObjReader.readMaterialsOnly(obj, mats => {
					var texturePaths = mats.materials.map(texNameToPath);
					
					if(texturePaths.length === 0) {
						return cb(console.error('Will not process model ' + obj + ': it has no textures at all.'));
					}
					
					var badTextures = texturePaths.filter(f => !f || typeof(f) !== 'string');
					if(badTextures.length > 0){
						return cb(console.error('Will not process model ' + obj + ': some of its triangles have no texture.'));
					}
					
					var nonSupportedTextures = [];
					texturePaths.eachAsync((path, cb) => isCorrectGif(path, result => {
						if(!result){
							nonSupportedTextures.push(path);
						}
						cb();
					}), () => {
						if(nonSupportedTextures.length > 0){
							return cb(console.error('Will not process model ' + obj + ': ' + nonSupportedTextures.length + ' texture images have some problems (.gif file expected).'));
						}
						
						var counter = new Countdown(1, () => (success++, cb && cb()));
				
						texturePaths.forEach(p => {
							counter.inc();
							transferFile(p, texBase, texDest, counter.dec);
						});
						
						ObjReader.getSimplifiedObj(obj, fixTexName, text => {
							createAndGetDestinationPath(obj, shapeBase, shapeDest, dest => {
								putFile(dest, text, counter.dec);
							});
						});
						
					});
				});
			};
			
			console.log('Getting raw shapes list...');
			var files = [];
			eachFileRecursiveIn(shapeBase, file => {
				file.match(/\.[Oo][Bb][Jj]/) && files.push(file)
			}, () => {
				console.log('Found ' + files.length + ' raw shapes.');
				
				files.eachAsync((path, cb) => {
					console.log('Processing ' + path);
					transferModel(path, cb)
				}, onOperationCompleted, 1);
			});
		}
		
		var recFillEmptyFields = (receiver, defs) => {
			Object.keys(defs).forEach(defKey => {
				var val = defs[defKey];
				
				if(defKey in receiver){
					if(typeof(receiver[defKey]) === 'object' && typeof(val) === 'object' && !Array.isArray(val) && val){
						recFillEmptyFields(receiver[defKey], val);
					}
				} else {
					receiver[defKey] = val;
				}
				
				
			});
		}
			
		
		var selfName = ((__filename.match(/[^\\\/]+$/) || [])[0] || '').replace(/\.[^\.]+$/, '');
		
		var getOps = () => config[selfName].operations.map(op => {
			recFillEmptyFields(op, config.directories)
			return op
		});
		
		getOps().eachAsync((op, cb) => {
			runFor(op.raw.texture, op.raw.shape, op.source.texture, op.source.shape, cb);
		}, onWorkDone);
		
	});