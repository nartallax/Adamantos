/*
	package/dependency managing system
	
	allows to define packages like aPackage('nart.libs.something', () => { ... return Something; })
	allows to require such packages as var Something = aRequire('nart.libs.something')
	allows to define application entry point as Addict.main(() => { ... })
	
	explicitly disallowed (will fail):
		circular dependencies
		require()ing something asynchronously
		package definitions that does not return truthy result
	
	it's expected and highly encouraged:
		not to rely on any platform-depending functionality on synchronous definition time
			it could make graph building impossible
		define exactly one package per file
			otherwise, some heisenbugs with 'definition not found' could occur
		for definition function not to have any side-effects
			at least at syncronous definition time
			definition function could be executed arbitrary number of times
	
	acts as platform abstraction level. supports browser(s) and node.js
	
	on browser, packages should be included on page in some way
	that is, addict expects all require()'d packages to be defined at point of requirement
		
	on node.js, packages could be included as well as be placed in some specific place
	example: we have package a.b.c.d.e
	to include it, we should:
	1. define root: Addict.addRoot('a.b', '/home/nart/node-libs')
	it's expected now that directory "/home/nart/node-libs" contains only packages inside module a.b
	it could be more than one root defined, but not on single directory
	2. put file in place with appopriate naming
	2.1. traditional directory style: /home/nart/node-libs/c/d/e.js
	2.2. flat style: /home/nart/node-libs/c.d.e.js
	2.3. mix of two previous styles: /home/nart/node-libs/c/d.e.js
	
	there also omnipresent packages.
	such packages usually contains something that could be used everywhere: some shims, prototype extensions etc
	
	TODO: rewrite this all, now it's just a mess (yet it's working)
*/
var Addict = (() => {
	'use strict';
	
	var startTimeoutHandle = null;
	
	var sourceDirectories = {};
	
	var packages = {};
	
	var isValidName = n => n.match(/^(?:[a-zA-Z\d]+\.)*[a-zA-Z\d]+$/)? true: false;
	var normalizeName = n => n.replace(/[^A-Za-z\d\.]/, '').toLowerCase()
	var pathToName = path => normalizeName(path.replace(/.[^.\\\/]+$/, '').split(/[\\\/]/).filter(p => p).join('.'));
	
	var FsCache = (() => {
			
		var FsCache = function(){
			this._readdir = {};
			this._stat = {};
		}
		
		FsCache.prototype = {
			fs: function(){ return this._fs || (this._fs = require('fs')) },
			readdir: function(path){ return this._readdir[path] || (this._readdir[path] = this.fs().readdirSync(path)) },
			stat: function(path){ return this._stat[path] || (this._stat[path] = this.fs().statSync(path)) },
			getSep: function(){ return this._sep || (this._sep = require('path').sep) },
			readdirRecursive: function(dir, res){
				res = res || [];
				var sep = this.getSep();
				
				this.readdir(dir)
					.forEach(file => {
						file = dir + sep + file;
						this.stat(file).isDirectory()?
							this.readdirRecursive(file, res):
							res.push(file)
					});
				
				return res;
			}
		}
		
		return FsCache;
		
	})();
	
	var fs = new FsCache();
	
	var fileOfPackage;
	
	(() => {
		
		var splitNamePath = p => {
			p = normalizeName(p)
			return p.length === 0? []: p.split('.')
		}
		
		var moduleDirName = (part, path) => {
			var dirs = fs.readdir(path).filter(p => normalizeName(p) === part)
			if(dirs.length > 1) throw new Error('Ambiguity detected while resolving module ' + part + ': "' + dirs.join('", "') + '"');
			return dirs[0]
		}
		
		var packageFileName = (parts, path) => {
			var name = parts.join('.')
			
			var paths = fs.readdir(path)
				.filter(p => p.toLowerCase().match(/\.js\s*$/)? true: false)
				.filter(p => normalizeName(p.replace(/\.[Jj][Ss]\s*$/, "")) === name)
				
			if(paths.length > 1) throw new Error('Ambiguity detected while resolving package ' + name + ': "' + paths.join('", "') + '"');
			
			return paths[0];
		}
		
		var withoutFirst = (parts, n) => {
			var res = [];
			for(var i = typeof(n) === 'number'? n: 1; i < parts.length; i++) res.push(parts[i]);
			return res;
		}
		
		var searchFileIn = (parts, path) => {
			
			if(parts.length > 1){
				var mod = moduleDirName(parts[0], path);
				if(mod){
					var result = searchFileIn(withoutFirst(parts), path + '/' + mod)
					if(result) return result;
				}
			}
			
			var pak = packageFileName(parts, path);
			if(pak) return path + '/' + pak;
			
			return null;
		}
		
		var startsWith = (small, big) => {
			for(var i in small) if(big[i] !== small[i]) return false;
			return true;
		}
		
		var searchFile = fileOfPackage = name => {
			var dirs = sourceDirectories, 
				parts = splitNamePath(name),
				file;
				
			for(var directoryName in dirs){
				var mparts = splitNamePath(normalizeName(dirs[directoryName]))
				if(!startsWith(mparts, parts)) continue;
				file = searchFileIn(withoutFirst(parts, mparts.length), directoryName);
				if(file) break;
			}
			
			return file;
		}
		
	})();
	
	var PackageStack = (() => {
	
		var PackageStack = function(){
			this.stack = [];
			this.map = {};
		}
		
		PackageStack.prototype = {
			push: function(name){
				if(this.map[name]) throw new Error('Circular dependency: ' + this.stack.join(' -> ') + ' -> ' + name);
				this.stack.push(name);
				this.map[name] = true;
			},
			pop: function(){
				var result = this.stack.pop();
				delete this.map[result]
				return result
			},
			peek: function(){ return this.stack[this.stack.length - 1] }
		}
		
		return PackageStack;
		
	})();
	
	var packageStack = new PackageStack(),
		isMainExecuting = false; // костыль, чтобы можно было require()ить из кода main зависимости
	
	var getPackage, dependenciesByName, moduleNamesWithPrefix;
	(() => {
		
		var dependenciesOfName = dependenciesByName = name => {
			if(!(name in packages)) discoverPackage(name);
			return dependenciesOf(packages[name]);
		}
		
		var dependenciesOf = pkg => {
			if(!pkg) return null;
			if(!('dependencies' in pkg)) activatePackage(pkg);
			var deps = {};
			Object.keys(pkg.dependencies).forEach(i => deps[i] = true);
			// omnipresents are counted not here - only after everything else is counted
			//Object.keys(Addict.omnipresentNames).forEach(i => deps[i] = true);
			return deps;
		}
		
		var productOfName = name => {
			if(!(name in packages)) discoverPackage(name);
			return productOf(packages[name]);
		}
		
		var productOf = pkg => {
			if(!pkg) return null;
			if('product' in pkg) return pkg.product;
			return activatePackage(pkg)
		}
		
		var activatePackage = def => {
			packageStack.push(def.packageName);
			def.dependencies = {};
			def.product = def();
			packageStack.pop()
			
			return def.product
		}
		
		var fileOrThrow = name => {
			var file = fileOfPackage(name);
			if(!file) throw new Error('Failed to resolve ' + name);
			return file;
		}
		
		var discoverPackage = name => {
			switch(Addict.realEnvironment){
				case 'node': return Addict.require.node(fileOrThrow(name));
				case 'browser': return; /* no autodiscovery for browsers */
			}
		};
		
		var productOfNameOrThrow = getPackage = (name, allowEmpty) => {
			var pkg = productOfName(name)
			if(!pkg && !allowEmpty) throw new Error('Could not load ' + name + '. Maybe some definition mistakes?');
			return pkg;
		}
		
		moduleNamesWithPrefix = prefix => {
			var result = [];
			
			Object.keys(sourceDirectories).filter(dir => {
				var pr = sourceDirectories[dir];
				return prefix.startsWith(pr);
			}).forEach(dir => {
				var dirPref = sourceDirectories[dir];
				fs.readdirRecursive(dir)
					.map(str => str.replace(dir, ""))
					.map(str => dirPref + '.' + pathToName(str))
					.filter(name => name.startsWith(prefix))
					.forEach(name => result.push(name));
			})
			
			return result;
		}
		
	})();
	
	var Addict = {
		package: (name, body) => {
			if(!isValidName) throw new Error('Package name ' + name + ' is not valid.');
			
			name = normalizeName(name);
			
			if(name in packages) throw new Error('Duplicate definition of ' + name);
			
			body.packageName = name;
			packages[name] = body;
		},
		
		require: (() => {
			var req = (name, allowEmpty, allowAsync) => {
				name = normalizeName(name)
				
				var requiringPackage = packageStack.peek();
				if(typeof(requiringPackage) === 'string'){
					packages[requiringPackage].dependencies[name] = true;
				} else if(!isMainExecuting && !allowAsync) {
					throw new Error('Package ' + name + ' is required asynchronously. Such requisitions are not allowed.');
				}
				
				return getPackage(name, allowEmpty)
			}
			
			req.node = typeof(require) !== 'undefined' && require.main && typeof(require.main.require) === 'function'?
				name => require.main.require(name): // for node external packages
				name => "NO_PACKAGE"; // we are not in node environment, could not load the package
			
			return req;
		})(),
		
		main: body => {
			if(startTimeoutHandle !== null) {
				clearTimeout(startTimeoutHandle);
				throw new Error('More than one entry points detected.');
			}
			
			startTimeoutHandle = setTimeout(() => {
				isMainExecuting = true;
				body();
				isMainExecuting = false;
			}, 1);
		},
		environments: ['node', 'browser'],
		environment: typeof(module) === 'undefined'? 'browser': 'node',
		addRoot: (module, dir) => {
			if(!isValidName(module) && module.length > 1) throw new Error('Invalid module name: ' + module);
			if(sourceDirectories[dir]) throw new Error('Directory "' + dir + '" could not be registered as root of module ' + module + ': its already registered as root of module ' + sourceDirectories[dir]);
			sourceDirectories[dir] = normalizeName(module);
			
			Addict.resetOmnipresentLoadStatusByPrefix(normalizeName(module))
			Addict.loadOmnipresents();
			
			return Addict;
		},
		
		// TODO: optimize omnipresents somehow
		omnipresentNames: {},
		omnipresentPrefixes: {},
		
		getOmnipresentList: () => Object.keys(Addict.omnipresentNames),
		
		registerOmnipresentPrefix: prefix => {
			prefix = normalizeName(prefix);
			Addict.omnipresentPrefixes[prefix] = false;
			Addict.loadOmnipresentsByPrefix(prefix);
			return Addict;
		},
		
		registerOmnipresentPackageName: name => {
			name = normalizeName(name);
			Addict.omnipresentNames[name] = true;
			Addict.require(name, true, true);
			return Addict;
		},
		
		resetOmnipresentLoadStatusByPrefix: prefix => {
			Object.keys(Addict.omnipresentNames)
				.filter(name => prefix.startsWith(name) || name.startsWith(prefix))
				.forEach(name => Addict.omnipresentNames[name] = false);
		},
		
		loadOmnipresents: () => {
			Object.keys(Addict.omnipresentPrefixes)
				.filter(pr => Addict.omnipresentPrefixes[pr])
				.forEach(pr => Addict.loadOmnipresentsByPrefix(pr))
		},
		
		loadOmnipresentsByPrefix: prefix => {
			Addict.omnipresentPrefixes[prefix] = true;
			
			moduleNamesWithPrefix(prefix).forEach(Addict.registerOmnipresentPackageName);
			
		},
		
		dependenciesOf: name => {
			var deps = dependenciesByName(normalizeName(name));
			Object.keys(Addict.omnipresentNames).forEach(i => {
				if(deps[i]) return;
				deps[i] = true;
				Object.keys(Addict.dependencyListOf(i)).forEach(key => deps[key] = true)
			});
			Object.keys(deps);
		},
		dependencyTreeOf: (name, noOmnipresents) => {
			var deps = dependenciesByName(normalizeName(name))
			for(var i in deps) deps[i] = Addict.dependencyTreeOf(i, noOmnipresents);
			!noOmnipresents && Object.keys(Addict.omnipresentNames).forEach(i => {
				deps[i] = true;
				var omniDepTree = Addict.dependencyTreeOf(i, true)
				Object.keys(omniDepTree).forEach(key => deps[key] = omniDepTree[key])
			});
			return deps;
		},
		dependencyListOf: (() => {
			
			var keysOf = (tree, res) => {
				res = res || {};
				for(var i in tree){
					res[i] = true;
					keysOf(tree[i], res);
				}
				return res;
			}
			
			return name => {
				var deps = keysOf(Addict.dependencyTreeOf(name)), res = [];
				for(var i in deps) res.push(i);
				return res;
			}
		})(),
		fileOf: fileOfPackage
	}
	
	var moduleByEnvironment = moduleEnvMap => Addict.require(moduleEnvMap[Addict.environment]);
	
	var withEnv = (env, body) => {
		var oldEnv = Addict.environment;
		Addict.environment = env;
		
		body();
		
		Addict.environment = oldEnv;
	}
	
	Addict.moduleByEnvironment = moduleByEnvironment;
	Addict.withEnvironment = withEnv;
	
	Addict.realEnvironment = Addict.environment;
	
	return Addict;
	
})()

var aPackage = Addict.package,
	aRequire = Addict.require;
	
if(Addict.environment === 'node'){
	module.exports = Addict;
	global.aPackage = aPackage;
	global.aRequire = aRequire;
}

Addict.global = typeof self === "undefined" ? typeof global === "undefined" ? this : global : self;

aPackage('nart.meta.addict', () => Addict);