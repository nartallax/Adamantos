aPackage('nart.net.http.requester', () => {

	var Addict = aRequire('nart.meta.addict');
	
	return Addict.moduleByEnvironment({
		'node': 'nart.net.http.requester.node',
		'browser': 'nart.net.http.requester.xhr'
	});;
});