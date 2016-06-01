aPackage('nart.util.log', () => {
	"use strict";
	
	var nowString = aRequire('nart.util.time').nowString;

	var str = smth => {
		switch(typeof(smth)) {
			case "function":return "[some function]";
			case "object":
				if(smth === null) return console.log(null);
				if(smth.message) 
					return smth.message; // for exceptions
				if(typeof(smth.toString) === 'function' && smth.toString !== Object.prototype.toString && smth.toString !== Array.prototype.toString)
					return smth.toString()
				return JSON.stringify(smth);
			case "boolean":	return smth? 'true': 'false';
			default: return smth + '';
		}
	}

	var log = function(){
		var args = arguments, res = '';
		
		for(var i = 0; i < args.length; i++) res += ' ' + str(args[i])
		
		console.log(nowString() + res);
		
		return log;
	};
	
	return log;
	
})