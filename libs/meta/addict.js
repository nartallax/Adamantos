/*
the Addict package management system (second edition)

meant to rule the packages, require them, finding out their dependencies and so on

is all synchronous by design, so better not use it after startup
*/
var Addict = (() => {
	"use strict";
	
	var deriveClassFrom = (baseClass, constr, proto) => {
		var FakeConstr = function(){}
		FakeConstr.prototype = baseClass.prototype;
		var protoObject = new FakeConstr();
		
		constr.prototype = protoObject;
		Object.keys(proto || {}).forEach(key => constr.prototype[key] = proto[key]);
		
		return constr;
	}
	
	var joinName = (a, b) => a.replace(/\.$/, '') + '.' + b.replace(/^\./, '');
	var normalizePrefix = prefix => normalizeName(prefix.replace(/\.$/, '')) + '.';
	var normalizeName = name => splitName(name.toLowerCase().replace(/[^a-z\d\.]/g, '')).join('.');
	var splitName = name => {
		var parts = name.split('.')
		parts.forEach(part => {
			if(!part) throw new Error('Name ' + name + ' is incorrect.')
		});
		return parts
	}
	var splitPrefix = prefix => splitName(prefix.replace(/\.$/, ''))
	
	
	// просто структура данных, без какой-либо специализации
	var Stack = (() => {
		
		var Stack = function(){
			this.data = [];
		}
		
		Stack.prototype = {
			getSize: function(){ return this.data.length },
			isEmpty: function(){ return this.data.length === 0 },
			push: function(data){ this.data.push(data) },
			pop: function(){ return this.data.pop() },
			peek: function(){ return this.data[this.data.length - 1] },
			toString: function(prefix){ 
				prefix = typeof(prefix) === 'string'? prefix: '\t';
				return prefix + this.data.map(el => prefix + el + '').join('\n') 
			},
			
			sliceTo: function(predicate){
				var result = [];
				
				for(var i = this.data.length - 1; i >= 0; i--){
					var el = this.data[i];
					result.push(el);
					if(predicate(el)){
						return result;
					}
				}
				
				return null;
			}
		}
		
		return Stack;
	})();
	
	// один пакет
	// мутабельный объект; в ходе своего жизненного цикла приобретает атрибуты, зависимости, исполняет definition и т.д.
	var Package = (() => {
		
		function(name, definition, fail){
			this.name = name;
			this.definition = definition;
			this.fail = fail;
			this.stack = stack;
			
			this.isExecuted = false;
			
			// результат выполнения definition
			this.product = null;
			
			// список пакетов, от которых явно зависит данный
			// не включает omnipresent-ы (если только пакет не зависит от них явно)
			this.dependencies = [];
			
			// набор флагов, описывающих пакет
			this.attributes = {
				isOmnipresent: false
			};
		}
		
		Package.prototype = {
			executeDefinition: function(){
				this.isExecuted && this.fail('Duplicate execution of package ' + this.name);
				this.product = this.definition.call(null);
				this.product || this.isOmnipresent || this.fail('Failed to execute a package ' + this.name + ': no valuable result received.');
			},
			addDependency: function(name){ this.dependencies.push(name) },
			toString: function(){ return 'package(' + this.name + ')' }
		}
		
		return Package;
		
	})();
	
	// класс, умеющий доставать откуда-то пакеты
	// привязана к конкретному пакету
	// все пакеты, запрошенные у этого класса, считаются зависимостями этого пакета
	var PackageResolver = (() => {
		
		var PackageResolver = function(pkg, getPkg){
			this.pkg = pkg;
			this.getPackage = getPkg;
		}
		
		PackageResolver.prototype = {
			toString: function(){ return 'resolver(' + this.pkg + ')' },
			getProduct: function(name){
				var pkg = this.getPackage(name);
				this.pkg.addDependency(pkg);
				return pkg.product;
			}
		}
		
		return PackageResolver;
		
	});
	
	// специальный резолвер пакетов
	// используется в случае, когда "текущий исполняющийся пакет" - не вполне обычен
	// например, в случае, когда зависимость запрашивается не каким-то определенным пакетом, а из main-а, или в качестве omnipresent-а
	var SpecialPackageResolver = (() => {
		
		var SpecialPackageResolver = deriveClassFrom(PackageResolver, function(getPkg, name){
			this.name = name;
			this.dependencies = [];
			PackageResolver.call(this, null, getPkg)
		}, {
			toString: function(){ return 'specialResolver(' + this.name + ')' },
			getProduct: function(name){ 
				var pkg = this.getPackage(name);
				this.dependencies.push(pkg);
				return pkg.product
			}
		})
		
	})();
	
	// словарь пакетов
	// ответственнен за хранение пакетов, а также за их исполнение и назначение им зависимостей
	var PackageDictionary = (() => {
		
		// discoverByName - функции поиска пакетов по имени
		// ожидается, что он не вернет пакет, а вызовет функцию его определения
		// функция определения передается в функцию поиска
		// (и вообще, см. PackageDiscoverer)
		var PackageDictionary = function(discoverByName){
			// стек из пакетов, definition которых исполняется в данный момент
			// необходим для отслеживания набора зависимостей, которые имеет определенный пакет
			this.resolverStack = new Stack();
			
			this.packages = {};
			
			this.discoverByName = discoverByName;
			
			this.beforeExecutionHandlers = [];
		}
		
		PackageDictionary.prototype = {
			fail: function(message){ throw new Error(message + '\nPackage requisition stack:\n' + this.resolverStack) },
			
			withRoot: function(name){
				if(!this.resolverStack.isEmpty()){
					this.fail([
						'Failed to create root package "' + name + '": you can\'t create root package on top of other package.',
						'If you need to create a root, you should do it after package is defined, not at definition time.',
					].join('\n\t'));
				}
				this.resolverStack.push(new SpecialPackageResolver(name => this.getExecutedPackage(name), name))
			},
			
			getProduct: function(name){
				if(this.resolverStack.isEmpty()){
					this.fail([
						'Failed to get product of package ' + name + ': no resolvers registered.',
						'Maybe you tried to request a package asynchronously?',
						'You should do it other way (if you REALLY want this and understand the consequences).'
					].join('\n\t'));
				}
				
				return this.resolverStack.peek().getProduct(name);
			},
			
			getDependencies: function(name){ return this.getExecutedPackage(name).dependencies },
			
			definePackage: function(name, definition){ 
				name in this.packages && this.fail('Duplicate definition of package ' + name);
				this.packages[name] = new Package(name, definition, msg => this.fail(msg)) 
			},
			
			// private
			getPackage: function(name){
				if(name in this.packages) return this.packages[name];
				this.discoverByName(name, (name, def) => this.definePackage(name, def));
				name in this.packages || this.fail('Failed to find package ' + name);
				return this.packages[name];
			},
			
			getExecutedPackage: function(name){
				var pkg = this.getPackage(name);
				pkg.isExecuted || this.executePackage(pkg);
				return pkg;
			},
		
			executePackage: function(pkg){
				var circle = this.resolverStack.sliceTo(res => res.package === pkg);
				if(circle){
					this.fail('Circular dependency found! Don\'t know how to resolve.\n\t' + circle.map(res => res.package.name).join('\n\t<-') + '\n')
				}
				
				this.resolverStack.push(new PackageResolver(pkg, name => this.getExecutedPackage(name)));
				pkg.executeDefinition();
				this.resolverStack.pop();
			}
		}
	
		return PackageDictionary;
		
	})();
	
	// словарь, умеющий учитывать omnipresent-ы
	// подгружает omnipresent-ы каждое определение root-а
	// конечно, можно было бы запретить определять омнипрезенты после первого определения рута
	// но тогда было бы сильно сложнее реализовывать сценарий модулей
	// которые подгружаются уже после старта основной программы и могут определять свои омнипрезенты
	// так что запретим определение омнипрезентов только в definition-time
	var OmnipresentDictionary = (() => {
		
		var OmnipresentDictionary = deriveClassFrom(PackageDictionary, function(discoverByName, discoverByPrefix){
			PackageDictionary.call(this, discoverByName);
			
			this.discoverByPrefix = discoverByPrefix;
			this.omnipresents = {};
			this.prefixes = [];
			
			this.omnipresentsAreModifiedSinceLastRootDefinition = false;
			TODO FINISH HIM
			//Object.keys(this.omnipresents).forEach(name => this.getProduct(name))
		}, {
			registerPrefix: function(prefix){
				if(!this.resolverStack.isEmpty()){
					this.fail('Failed to define omnipresent prefix: all omnipresents should be defined before root definition, not at definition time.');
				}
				
				this.prefixes.push(prefix);
				
				discoverByPrefix(prefix, (name, def) => {
					this.definePackage(name, def)
					this.registerPackage(name);
				});
			},
			
			getRegisterPrefixes: function(){ return this.prefixes; },
			
			//private
			registerPackage: function(name){
				this.omnipresentsAreModifiedSinceLastExecution = true;
				this.omnipresents[name] = true;
				this.base.getPackage(name).attributes.isOmnipresent = true;
				this.base.getDependencies(name).forEach(pkg => this.registerPackage(pkg.name));
			},
			
			getOmnipresents: function(){ return Object.keys(this.omnipresents) }
		})
		
		return OmnipresentDictionary;
		
	})();
	
	// некоторый хитрый объект, умеющий изменять код пакетов и исполнять этот код
	// например, дописывать "use strict" в начало определения
	// также возможны разного рода макрозамены
	var CodeManipulator = (() => {
		
		var CodeManipulator = function(fail, exceptionCodeLength){
			this.fail = fail;
			this.exceptionCodeLength = exceptionCodeLength || 150;
			this.fixAndRun = code => this.fixAndRunCode(code);
		}
		
		CodeManipulator.prototype = {
			packageHeaderRegexp: /^.*?(?:[Ff][Uu][Nn][Cc][Tt][Ii][Oo][Nn]\s*\(.*?\)\s*\{|=>(?:\s*\{)?)/,
			
			failWithCode: function(msg, code){
				code = code.length > this.exceptionCodeLength? code.substr(0, exceptionCodeLength - 3) + '...': code;
				this.fail(msg + '\nCode: ' + code);
			},
			
			fixCode: function(code){ return this.ensureStrictMode(code) },
			
			ensureStrictMode: function(code){
				var header = (code.match(packageHeaderRegexp) || [])[0];
				header || this.failWithCode('Failed to extract header from package code.', code);
				return header + '"use strict";' + code.replace(this.packageHeaderRegexp, '')
			},
			
			// TODO: think about other options, such as new Function(code); maybe they will be worth it
			runCode: function(code){ return eval(code) },
			
			fixAndRunCode: function(code){ return this.runCode(this.fixCode(code)) }
		}
		
		return CodeManipulator;
		
	})();
	
	// искатель пакетов. знает, откуда их брать. абстрактен.
	// опирается на стек обработчиков определения пакета
	// т.о. не получает описание пакетов напрямую, а делает какие-то действия,
	//		после которых вызывается функция определения пакета (наверху этого стека)
	// наиболее вероятное действие - исполнение кода определения; 
	// этот код вызовет глобальную функцию определения, а она уже вызовет функцию наверху стека
	// ... но возможны варианты.
	var PackageDiscoverer = (() => {
		
		var PackageDiscoverer = function(handlerStack, fail){
			this.fail = fail;
			
			// стек из обработчиков определения пакета
			// теоретически, обработчики могут быть вложены друг в друга
			// а также единого синглтон-правильного обработчика нет
			// поэтому следует хранить их так
			
			// идеологически, ни один пакет не определяется самостоятельно; все пакеты определяются только "по запросу"
			// т.о. нет никакой нужды иметь единственно правильный обработчик всегда
			this.definitionHandlerStack = handlerStack;
			
			this.discoverByName = (name, onPackageFound) => {
				this.withHandler(onPackageFound, () => this.findPackageByName(name));
			}
			
			this.discoverByPrefix = (prefix, onPackageFound) => {
				this.withHandler(onPackageFound, () => this.findPackagesByPrefix(prefix))
			}
		}
		
		PackageDiscoverer.prototype = {
			withHandler: function(handler, cb){
				this.definitionHandlerStack.push(handler);
				cb();
				this.definitionHandlerStack.pop();
			},
			
			findPackageByName: function(){ throw new Error('Not implemented.'); },
			findPackagesByPrefix: function(){ throw new Error('Not implemented.'); }
		}
		
		return PackageDiscoverer;
		
	})();
	
	// искатель пакетов, добывающий код, но не определения пакетов. абстрактен.
	var RawCodeDiscoverer = (() => {
		
		var RawCodeDiscoverer = deriveClassFrom(PackageDiscoverer, function(stack, fail, runCode){
			this.runCode = runCode;
			PackageDiscoverer.call(this, stack, fail);
		}, {
			findPackageByName: function(name){ this.runCode(this.findPackageCodeByName(name)) },
			findPackagesByPrefix: function(prefix){ this.findPackagesCodeByPrefix(prefix).forEach(code => this.runCode(code)) },
			
			findPackageCodeByName: function(name){ throw new Error('Not implemented') },
			findPackagesCodeByPrefix: function(prefix){ throw new Error('Not implemented') }
		})
		
		return RawCodeDiscoverer;
		
	})();
	
	// искатель пакетов по файловой системе
	var FsPackageDiscoverer = (() => {
		
		var FsPackageDiscoverer = deriveClassFrom(RawCodeDiscoverer, function(stack, fail, runCode){
			
			this.packageToFileMap = {};
			this.fileToPackageMap = {};
			
			this.fs = require('fs');
			this.sep = require('path').sep;
			
			this.roots = {};
			
			RawCodeDiscoverer.call(this, stack, fail, runCode);
		}, {
			addRoot: function(path, prefix){
				this.roots[path] = prefix;
				this.addDirectory(path);
			},
			
			getRoots: function(){ return this.roots },
			
			//privates
			addDirectory: function(path, prefix){
				path = this.normalizePath(path);
				var pathParts = this.splitPathToParts(path);
				var prefixParts = splitPrefix(prefix);
				
				this.fs.readdirSync(path).forEach(entry => {
					var fullPath = this.joinPath(path, e),
						entryName = this.normalizeName(entry),
						fullEntryName = joinName(prefix, entryName)),
						isDir = this.fs.statSync(fullPath).isDirectory();
					
					(!isDir && entry.toLowerCase.endsWith('.js'))?
						this.addPackage(fullPath, fullEntryName):
						(isDir && this.addDirectory(fullPath, fullEntryName));
				})
			},
			
			addPackage: function(path, name){
				name = normalizeName(name);
				path = this.normalizePath(path);
				
				path in this.fileToPackageMap && this.fileToPackageMap[path] !== name && 
					this.fail('Ambigious package ' + path  + ' name: ' + name + ' or ' + this.fileToPackageMap[path] + '? Can\'t decide. Check for bad roots added.');
					
				name in this.packageToFileMap && this.packageToFileMap[name] !== path && 
					this.fail('Ambigious package ' + name  + ' path: ' + path + ' or ' + this.packageToFileMap[name] + '? Can\'t decide. Check for bad roots added.');
					
				this.fileToPackageMap[path] = name;
				this.packageToFileMap[name] = path;
			},
			
			getPackageFilePath: function(name){
				name in this.packageToFileMap || this.fail('There are no path to package named ' + name + '.');
				return this.packageToFileMap[name];
			},
			
			getPackageFilesByPrefix: function(prefix){
				return Object.keys(this.packageToFileMap).filter(name => name.startsWith(prefix));
			},
			
			getCodeFromFile: function(path){ return this.fs.readFileSync(path, 'utf8') },
			
			findPackageCodeByName: function(name){ return this.getCodeFromFile(this.getPackageFilePath(name)) },
			findPackageCodesByPrefix: function(prefix){ return this.getPackageFilesByPrefix(prefix).map(path => this.getCodeFromFile(path)) },
			
			normalizePath: function(pth){ return pth.replace(/[\\\/]$/, '').replace(/(?:[\\\/]|^)(?:[^\\\/]+[\\\/]\.\.|\.)(?=[\\\/]|$)/g, '') || '.' },
			joinPath: function(a, b){ return this.normalizePath(a).replace(/[\\\/]+$/, '') + this.sep + this.normalizePath(b).replace(/^[\\\/]/, '') },
			splitPath: function(pth){ return this.normalizePath(pth).split(/[\\\/]/g) },
			splitPathToNameParts: function(pth){ 
				var result = [];
				this.splitPath(pth).forEach(p => splitName(p).forEach(pp => result.push(pp)));
				return result;
			}
		});
		
		return FsPackageDiscoverer;
		
	})()
	
	// искатель пакетов в спец.тегах
	var DomPackageDiscoverer = (() => {
		
		var DomPackageDiscoverer = deriveClassFrom(RawCodeDiscoverer, function(stack, fail, runCode, tagName, codeAttrName, nameAttrName){
			this.tagName = tagName || 'package';
			this.nameAttrName = codeAttrName || 'data-addict-package-name';
			this.codeAttrName = nameAttrName || 'data-addict-package-code';
			
			RawCodeDiscoverer.call(this, stack, fail, runCode);
		}, {
			
			querySingle: function(name){ return document.querySelector(this.tagName + '[' + this.nameAttrName + '="' + name + '"]') },
			queryMultiple: function(prefix){
				var nodeList = document.querySelectorAll(this.tagName + '[' + this.nameAttrName + '^="' + prefix + '"]');
				var arr = [];
				for(var i = 0; i < nodeList.length; i++) arr.push(nodeList[i]);
				return arr;
			},
			codeOfTag: function(tag){ return tag.getAttribute(this.codeAttrName) },
			
			findPackageCodeByName: function(name){ return this.codeOfTag(this.querySingle(name)) },
			findPackageCodesByPrefix: function(prefix){ return this.queryMultiple(prefix).map(tag => this.codeOfTag(tag)) }
		});
		
		return DomPackageDiscoverer;
		
	})();
	
	// описание среды, в которой исполняется данный скрипт
	var Environment = (() => {
		
		var Environment = function(type, name, version, platform){
			this.type = (type || '').trim().toLowerCase();
			this.name = (name || '').trim();
			this.version = (version || '').trim().replace(/^v/, '').replace(/(^[\s\.]+|[\s\.]+$)/, '');
			this.platform = (platform || '').trim();
		}
		
		Environment.prototype = {
			toString: function(){ 
				return (this.name? '': this.type)
					+ (this.name? this.name: '') 
					+ (this.version? ' v' + this.version: '')
					+ (this.platform? ' on ' + this.platform: '')
			},
			
			withType: function(type){ return new Environment(type, this.name, this.version, this.platform) },
			withName: function(name){ return new Environment(this.type, name, this.version, this.platform) },
			withVersion: function(version){ return new Environment(this.type, this.name, version, this.platform) },
			withPlatform: function(platform){ return new Environment(this.type, this.name, this.version, platform) }
		}
		
		
		var parseUserAgentPairs = (() => {
			
			var parsePair = str => {
				var parts = str.trim().match(/^(.*?)(?:[\\\/\s]+(\d.*?))?$/)
				return parts? { name: (parts[1] || '').trim(), version: (parts[2] || '').trim() }: null;
			}
			
			var parseParenthesed = (str, result) => {
				result = result || [];
				
				(str.match(/\(.*?\)/g) || [])
					.forEach(parCont => parCont
						.replace(/[\(\)]/g, '')
						.split(';')
						.map(parsePair)
						.filter(p => p)
						.forEach(pair => result.push(pair))
					)
					
				return result;
			}
			
			var parseUnparenthesed = (str, result) => {
				result = result || [];
				
				(str.replace(/\(.*?\)/g, ' ').match(/\s*(.+?)(?:[\\\/\s]+([\d\.]+))/g) || [])
					.map(parsePair)
					.filter(p => p)
					.forEach(pair => result.push(pair));
					
				return result;
			}
			
			var uaPriority = ua => ((ua = ua.toLowerCase()), (ua in browserPriority? browserPriority[ua]: 0))
			
			var parseUA = str => parseUnparenthesed(str, parseParenthesed(str))
				.sort((a, b) => ((a = uaPriority(a.name)), (b = uaPriority(b.name)), a > b? -1: a < b? 1: 0));
			
			return parseUA;
			
		})();
		Environment.detectIfInBrowser = () => typeof(window) !== 'undefined';
		Environment.getCurrentBrowserEnvironment = () => {
			if(typeof(window.navigator) === 'undefined') return new Environment('browser');
			
			var uaPair = window.navigator.userAgent? parseUserAgentPairs(window.navigator.userAgent)[0] || null: null;
			
			uaPair = uaPair || { 
				name: window.navigator.appCodeName || '', 
				version: (((window.navigator.appVersion || '').match(/^\s*[\d\.]+/) || [])[0] || '')
			};
			
			return new Environment('browser', uaPair.name, uaPair.version, window.navigator.platform);
		}
		Environment.getCurrentNodeEnvironment = () => new Environment('node', 'Node.JS', process.version, require('os').platform());
		Environment.getCurrent = () => Environment.detectIfInBrowser()? 
			Environment.getCurrentBrowserEnvironment():
			Environment.getCurrentNodeEnvironment();
		
		// браузеры, не вошедшие в этот список, не будут выкинуты
		// на самом деле, этот список нужен затем, чтобы определять наиболее вероятный браузер
		// т.к. иногда браузеры выдают большой список пар имя-версия в user-agent
		// и по-другому невозможно понять, какую же из этих пар в действительности следует взять
		Environment.knownBrowsers = [
			"Chrome", "Trident", "MSIE", "Firefox", "Edge", "Internet Explorer", "Iron", "Maxthon", "Opera", "Safari", "Konqueror", "Mozilla", "Netscape"
		]
		
		var browserPriority = (() => {
			var result = {}, index = Environment.knownBrowsers.length;
			
			Environment.knownBrowsers.forEach(name => result[name.toLowerCase()] = index--)
			
			return result;
		})();
		
		return Environment;
		
	})();
	
	// собственно система управления	
	var Addict = (() => {
		
		var Addict = function(){
			this.fail = msg => this.dictionary.fail(msg);
			
			this.environment = Environment.getCurrent();
			this.global = getGlobalObject();
			
			this.packageDefinitionHandlerStack = new Stack();
			this.codeManipulator = new CodeManipulator(fail);
			this.discoverer = this.createDiscoverer();
			
			this.setDictionaries();
		}
		
		Addict.prototype = {
			definePackage: function(name, definition){
				if(this.packageDefinitionHandlerStack.isEmpty()){
					this.fail('Could not add definition of package ' + name + ': no definition handler.'
						+ '\nDon\'t try to force-define packages. Package should be defined only at point it is required first time.');
				}
			},
			
			getPackage: function(){
			},
			
			withEnvironment: function(newEnv, body){
				var oldEnv = this.environment;
				this.environment = newEnv;
				body();
				this.environment = oldEnv;
			},
			
			withClearDictionaries: function(body){
				var oldOmni = this.omnipresentDictionary,
					oldDict = this.dictionary;
					
				this.setDictionaries();
				
				oldOmni.getPrefixes().forEach(prefix => this.omnipresentDictionary.addPrefix(prefix));
					
				body();
				
				this.setDictionaries(oldDict, oldOmni);
			},
			
			// private 
			createDiscoverer: function(){
				var constr = null;
				
				switch(this.environment.type){
					case 'node': 
						constr = FsPackageDiscoverer;
						break;
					case 'browser': 
						constr = DomPackageDiscoverer;
						break;
					default: throw new Error('Don\'t know how to handle environment type "' + this.environment.type + '".');
				}
				
				return new constr(this.packageDefinitonHandlerStack, this.fail, code => this.codeManipulator.fixAndRun(code))
			},
			
			getGlobalObject: function(){
				switch(this.environment.type){
					case 'node': return global;
					case 'browser': return window;
					default: throw new Error('Don\'t know how to handle environment type "' + this.environment.type + '".');
				}
			},
			
			setDictionaries: function(omni, dict){				
				this.dictionary = dict || new PackageDictionary(name => this.discoverer.discoverByName(name));
				this.omnipresentDictionary = omni || new OmnipresentDictionary(this.dictionary, prefix => this.discoverer.discoverByPrefix(prefix));
			}
		};
		
		Addict.genericBrowserEnvironment = new Environment('browser');
		Addict.genericNodeEnvironment = new Environment('node');
		
		return Addict;
		
	})();
	
	
})();