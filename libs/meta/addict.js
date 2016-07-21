/*
the Addict package management system (second edition)

meant to rule the packages, require them, finding out their dependencies and so on

is all synchronous by design, so better not use it after startup
*/
var Addict = (() => {
	
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
			
			this.isExecuted = false;
			
			// результат выполнения definition
			this.product = null;
			
			// список имен пакетов, от которых явно зависит данный
			// не включает omnipresent-ы
			this.dependencies = [];
			
			// набор флагов, описывающих пакет
			this.attributes = {
				isOmnipresent: false
			};
		}
		
		Package.prototype = {
			executeDefinition: function(){
				this.product = this.definition.call(null);
				this.product || this.isOmnipresent || this.fail('Failed to execute a package ' + this.name + ': no valuable result received.');
			},
			addDependency: function(name){ this.dependencies.push(name) },
			toString: function(){ return 'package(' + this.name + ')' }
		}
		
		return Package;
		
	})();
	
	// словарь пакетов
	// ответственнен за хранение пакетов, а также их своевременное определение и назначение им зависимостей
	var PackageDictionary = (() => {
		
		// discoverByName - функции поиска пакетов по имени
		// ожидается, что он не вернет пакет, а вызовет функцию его определения
		// функция определения передается в функцию поиска
		// (и вообще, см. PackageDiscoverer)
		var PackageDictionary = function(discoverByName){
			// стек из пакетов, definition которых исполняется в данный момент
			// необходим для отслеживания набора зависимостей, которые имеет определенный пакет
			this.packageStack = new Stack();
			
			this.packages = {};
			
			this.discoverByName = discoverByName;
		}
		
		PackageDictionary.prototype = {
			fail: function(message){ throw new Error(message + '\nPackage requisition stack:\n' + this.packageStack) },
			getStackSize: function(){ return this.packageStack.getSize() },
			definePackage: function(name, definition){ this.packages[name] = new Package(name, definition, msg => this.fail(msg)) },
			
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
				this.packageStack.push(pkg);
				pkg.executeDefinition();
				this.packageStack.pop();
			},
			
			getProduct: function(name){ return this.getExecutedPackage(name).product },
			/*
			// публичный АПИ
			
			// вызывается, когда какой-либо пакет хочет запросить зависимость
			processProductRequest: function(name){
				this.packageStack.isEmpty() && this.fail('Failed to satisfy dependency: required outside of package definition (or asynchronously).');
				this.packageStack.peek().addDependency(name);
				return this.getProduct(name);
			},
			
			// вызывается, когда какой-либо пакет хочет определиться
			processDefinitionRequest: function(name, definition){
				this.packageStack.isEmpty() || this.fail('Failed to define package: package nesting is not allowed.');
				this.definePackage(name, definition);
			},
			
			// вызывается в случае, когда непонятно, определяется ли пакет или запрашивается
			processRequest: function(name, definition){
				return typeof(definition) === 'function'? this.processDefinitionRequest(name, definition): this.processProductRequest(name);
			}
			*/
		}
	
		return PackageDictionary;
		
	})();
	
	// словарь, умеющий учитывать omnipresent-ы
	// базируется на другом словаре
	var OmnipresentDictionary = (() => {
		
		var OmnipresentDictionary = function(baseDictionary, discoverByPrefix){
			this.base = baseDictionary;
			this.discoverByPrefix = discoverByPrefix;
			this.omnipresents = {};
		}
		
		OmnipresentDictionary.prototype = {
			registerPackage: function(name){
				this.base.getPackage().attributes.isOmnipresent = true;
				this.omnipresents[name] = true;
			},
			
			registerPrefix: function(prefix){
				discoverByPrefix(prefix, (name, def) => {
					this.base.definePackage(name, def)
					this.registerPackage(name);
				});
			},
			
			getOmnipresents: function(){ return Object.keys(this.omnipresents) }
		}
		
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
		
		var PackageDiscoverer = function(handlerStack){
			if(!handlerStack) return this; // we should be used as prototype constructor
			
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
				this.withHandler(onPackageFound)
			}
		}
		
		PackageDiscoverer.prototype = {
			withHandler: function(handler, cb){
				this.definitionHandlerStack.push(handler);
				cb();
				this.definitionHandlerStack.pop();
			}
		}
		
		return PackageDiscoverer;
		
	})();
	
	// искатель пакетов, добывающий код, но не определения пакетов. абстрактен.
	var RawCodeDiscoverer = (() => {
		
		var RawCodeDiscoverer = function(stack, runCode){
			if(!stack) return this; // for prototype
			
			this.runCode = runCode;
			PackageDiscoverer.call(this, stack);
		}
		
		RawCodeDiscoverer.prototype = new PackageDiscoverer();
		
		var proto = {
			
		}
		
		Object.keys(proto).forEach(key => RawCodeDiscoverer.prototype[key] = proto[key]);
		
	})();
	
	// искатель пакетов по файловой системе
	var FsPackageDiscoverer = (() => {
		
		var FsPackageDiscoverer = function(){
			this.roots = {};
		}
		
		FsPackageDiscoverer.prototype = {
			addDirectory: function(path, prefix){ this.roots[path] = prefix || '' },
			
		}
		
		return FsPackageDiscoverer;
		
	})()
	
})();