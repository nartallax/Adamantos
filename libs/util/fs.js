aPackage('nart.util.fs', () => {

	var log = aRequire('nart.util.log'),
		fs = aRequire.node('fs'),
		path = aRequire.node('path'),
		err = aRequire('nart.util.err'),
		eachAsync = aRequire('nart.util.collections').eachAsync;

	var rmDir = (path, cb) => {
		fs.readdir(path, err(files => {
			eachAsync(files || [], (f, cb) => {
				f = path + '/' + f;
				fs.stat(f, err(stat => {
					if(!stat) return;
					
					stat.isDirectory()? rmDir(f, cb): fs.unlink(f, err(cb))
				}))
			}, () => {
				fs.rmdir(path, err(cb))
			})
		}));
	}
	
	var eachFileRecursive = (dirPath, onFile, after) => {
		fs.readdir(dirPath, err(files => {
			eachAsync(files || [], (f, cb) => {
				f = path.join(dirPath, f);
				fs.stat(f, err(stat => {
					if(!stat) return;
					
					stat.isDirectory()? eachFileRecursive(f, onFile, cb): (onFile(f), cb())
				}))
			}, after)
		}));
	}
	
	var mkDir = (() => {
		
		var byParts = (parts, cb) => {
			
			switch(parts.length){
				case 0: return cb();
				case 1: return parts[0]? fs.mkdir(parts[0], cb): cb();
				default:
					byParts(parts.slice(0, parts.length - 1), e => {
						if(e && (e.code || '').toLowerCase() !== 'eexist'){
							return cb(e);
						}
						
						fs.mkdir(parts.join(path.sep), cb);
					})
					break;
			}
			
		}
		
		return (dirPath, cb) => byParts(dirPath.split(path.sep), cb || (() => {}))
		
	})();
		
	var getFileInDir = (baseDir, cb, filePrefix, filePostfix, onError) => {
		var name = path.join(baseDir, (filePrefix || '') + Math.round((Math.random() + 1) * 0xffffffff) + (filePostfix || ''));
		fs.stat(name, e => {
			if(e && !e.message.startsWith('ENOENT')){
				(onError || log)(e)
				getFileInDir(baseDir, cb, filePrefix, filePostfix, onError);
			} else cb(name);
		})
	}
	
	var normalizePath = pth => path.join.apply(path, pth.split(/[\\\/]/));
	var splitPath = pth => normalizePath(pth).split(/[\\\/]/);
		
	return {
		
		// atomic... or very close to.
		putFile: (path, data, cb, onError) => {
			var tmp = path + '.temporary';
			
			// по докам, если data instanceof Buffer, то третий параметр игнорируется
			// так что и Buffer должно получаться писать
			fs.writeFile(tmp, data, 'utf8', e => {
				e && (onError || log)(e);
				fs.rename(tmp, path, e => {
					e && (onError || log)(e);
					cb && cb()
				})
			})
		},
		
		// NOT atomic, not even close
		appendFile: (path, data, cb, onError) => {
			fs.open(path, 'a', (e, id) => {
				e && (onError || log)(e);
				fs.write(id, data, null, 'utf8', e => {
					e && (onError || log)(e);
					fs.close(id, e => {
						e && (onError || log)(e);
						cb && cb();
					});
				});
			});
		},
		
		// recursive
		rmDir: rmDir,
		
		// recursive, relatively failsafe
		mkDir: mkDir,
		
		// leave only existing file paths
		// do not alters the order of the items, just removes some of them
		filterExisting: (paths, cb, onError) => {
			var emap = {};
			eachAsync(paths, (file, cb) => {
				fs.stat(file, (e, data) => {
					if(e){
						if(!e.message.startsWith('ENOENT')) (onError || log)(e);
					} else {
						emap[file] = true;
					}
					
					cb();
				})
			}, () => cb(paths.filter(p => emap[p])))
		},
		
		eachFileRecursiveIn: eachFileRecursive,
		
		getFileInDir: getFileInDir,
		
		readLines: (path, cb) => fs.readFile(path, 'utf8', err(text => cb((text || '').split(/[\n\r]+/)))),
		
		normalizePath: normalizePath,
		splitPath: splitPath
	}

})