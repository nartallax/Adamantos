aPackage('nart.util.throw', () => {
	
	var formatter = aRequire('nart.util.formatter');
	
	var Throw = function(message, code){
		var err = new Error(message);
		err.code = code || 'GENERIC_ERROR';
		throw err;
	};
	
	Throw.formatted = (formatStr, code) => {
		var frmt = formatter(formatStr);
		return function(){ 
			Throw.call(this, frmt.apply(null, arguments), code);
		}
	}
	
	return Throw;
});