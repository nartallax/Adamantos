aPackage('nart.util.err', () => {

	var logFn = aRequire('nart.util.log')

	// simple wrapper that allows just log the error and proceed further
	return (cb, log) => function(){
		var args = [], error = arguments[0]
		for(var i = 1; i < arguments.length; i++){
			args.push(arguments[i]);
		}
		error && (log || logFn)(error);
		cb && cb.apply(this, args);
	}

})