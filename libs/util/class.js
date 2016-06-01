aPackage('nart.util.class', () => {
	"use strict";

	var defineClass = (constr, mix, proto) => {
		constr.prototype = mixedProto(proto || function(){}, mix || {});
		
		constr.prototype.class = constr;
		constr.prototype.super = (proto || function(){}).prototype
		
		return constr;
	};

	var mixedProto = function(cls, args){
		var res = function(){}
		res.prototype = cls.prototype;
		var result = new res();
		
		for(var i = 1; i < arguments.length; i++){
			//console.log('---------');
			var mix = arguments[i];
			Object.keys(mix).forEach(j => {
				result[j] = mix[j]
				//console.log(j + ' -> ' + typeof(mix[j]));
			})
		}
		
		return result;
	}

	var callAsConstructor = (constr, args) => {
		// решение ниже - в разы более красивое и правильное
		// но по совершенно непонятным мне причинам иногда не работает (не передаются аргументы)
		/*
		var bindArgs = copyMergeArrayLike([null], args) // первый аргумент - this; т.к. это конструктор, передавать в него this бессмысленно
		var boundFunction = Function.prototype.bind.apply(constr, bindArgs)
		return new boundFunction();
		*/
		
		// а это решение - стремное и брутфорсное, но зато работает идеально
		// давайте просто будем надеяться, что никто не передает в конструктор больше 32 аргументов
		return new constr(
			args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7],
			args[8], args[9], args[10],args[11],args[12],args[13],args[14],args[15],
			args[16],args[17],args[18],args[19],args[20],args[21],args[22],args[23],
			args[24],args[25],args[26],args[27],args[28],args[29],args[30],args[31]
		);
	};
	
	// позволяет сконструировать новый класс, на основании старого, конструктора для нового и прототипа для нового
	// возвращает конструктор, делающий все, что надо
	var classBasedOn = (oldConstr, newConstr, newProto) => {
		newProto = newProto || {};
		newConstr = newConstr || function(){};
		oldConstr = oldConstr || function(){};
		
		var pseudoConstructor = function(){};
		pseudoConstructor.prototype = oldConstr.prototype;
		var oldProto = new pseudoConstructor();
			
		var realConstr = function(){
			if(!(this instanceof realConstr)) return callAsConstructor(realConstr, arguments);
			
			this.super = oldConstr.prototype;
			
			oldConstr.apply(this, arguments);
			newConstr.apply(this, arguments);
		}
		
		for(var i in newProto){
			oldProto[i] = newProto[i];
		}
		
		realConstr.prototype = newConstr.prototype = oldProto;
		
		return realConstr;
	}
	
	return {
		define: defineClass,
		proto: mixedProto,
		callAsConstructor: callAsConstructor,
		classBasedOn: classBasedOn
	}
	
});