aPackage('nart.omnipresent.fail', () => {
	
	var formatter = aRequire('nart.util.formatter'),
		glob = aRequire('nart.meta.addict').global;
	
	var fail = function(message, code){
		var err = new Error(message);
		err.code = code || 'GENERIC_ERROR';
		throw err;
	};
	
	fail.formatted = (formatStr, code) => {
		var frmt = formatter(formatStr);
		return function(){ 
			Throw.call(this, frmt.apply(null, arguments), code);
		}
	}
	
	glob.fail = fail;
	
	return fail;
});