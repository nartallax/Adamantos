// класс, умеющий собирать из модулей одну строку, в которой будут содержаться все эти модули и их зависимости, а также точка входа
aPackage('nart.util.script.assembler', () => {

	var Addict = aRequire('nart.meta.addict'),
		eachAsync = aRequire('nart.util.collections').eachAsync,
		log = aRequire('nart.util.log'),
		fs = aRequire.node('fs');

	var ScriptAssembler = function(){
		if(!(this instanceof ScriptAssembler)) return new ScriptAssembler();
		this.modules = {'nart.meta.addict': true};
		this.main = null;
	};
	
	ScriptAssembler.prototype = {
		add: function(module){ 
			this.modules[module] = true;
			Addict.dependencyListOf(module).forEach(name => this.modules[name] = true);
			return this;
		},
		setMainPackage: function(module){
			this.add(module);
			this.main = module;
			return this;
		},
		assemble: function(cb){
			if(!this.main) throw 'Failed to assemble script: no main module set.';
			
			var files = Object.keys(this.modules)
				.sort((a, b) => a === 'nart.meta.addict'? -1: a === this.main? 1: 0)
				.map(f => Addict.fileOf(f));
				
			var code = {};
				
			eachAsync(files, (f, cb) => {
				fs.readFile(f, 'utf8', (e, data) => {
					e && log(e);
					code[f] = data;
					cb();
				})
			}, () => {
				cb('(() => {' + files.map(f => code[f]).join(';\n') +  ';\nAddict.main(() => { aRequire("' + this.main + '")(); })\n})();')
				
			})
		}
	}

	return ScriptAssembler;
	
});