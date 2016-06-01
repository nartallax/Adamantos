aPackage('nart.util.html', () => {
	
	return {
		
		// TODO: something more robust
		escapeHtml: str => str
			.replace(/</, '&lt;')
			.replace(/>/, '&gt;')
			.replace(/"/, '&quot;')
		
	}
	
});