aPackage('nart.omnipresent.class', () => {
	"use strict";
	
	var callAsConstructor = (constr, args) => {
		// это решение - стремное и брутфорсное, но зато работает идеально
		// давайте просто будем надеяться, что никто не передает в конструктор больше 32 аргументов
		// есть более красивое решение:
		// return new Function.prototype.bind.apply(constr, copyMergeArrayLike([null], args));
		// ... но почему-то иногда не работает
		return new constr(
			args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7],
			args[8], args[9], args[10],args[11],args[12],args[13],args[14],args[15],
			args[16],args[17],args[18],args[19],args[20],args[21],args[22],args[23],
			args[24],args[25],args[26],args[27],args[28],args[29],args[30],args[31]
		);
	};
	
	var defineClass = (constr, mix, protoConstr) => {
		if((constr && typeof(constr.prototype) !== 'function')){
			fail('Failed to define a class: passed value could not be used as constructor: ' + constr);
		}
		
		protoConstr = protoConstr || function(){};
		mix = mix || {};
		
		var realConstr = constr || function(){};
		var pseudoConstr = function(){
			if(!(this instanceof pseudoConstr)) return callAsConstructor(pseudoConstr, arguments);
			realConstr.apply(this, arguments);
		}
		
		var ProtoFakeConstr = function(){}
		ProtoFakeConstr.prototype = protoConstr.prototype;
		pseudoConstr.prototype = new ProtoFakeConstr();
		Object.keys(mix).forEach(key => pseudoConstr.prototype[key] = mix.prototype[key])
		
		pseuoConstr.prototype = mixedProto(protoConstr, mix);
		pseuoConstr.prototype.class = pseudoConstr;
		pseuoConstr.prototype.super = function(){
			if(!(this instanceof protoConstr)) return callAsConstructor(protoConstr, arguments);
			protoConstr.apply(this, arguments) 
		}
		pseuoConstr.prototype.super.prototype = protoConstr.prototype;
		pseuoConstr.prototype.derive = pseuoConstr.derive = (newConstr, newMix) => defineClass(newConstr, newMix, pseudoConstr);
		
		return pseuoConstr;
	};
	
	Object.derive = (newConstr, newMix) => defineClass(newConstr, newMix, null);
	

});