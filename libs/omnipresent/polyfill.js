// polyfill omnipresent package
// contains polyfills for most widely used functions
aPackage('nart.omnipresent.polyfill', () => {
	var glob = typeof self === "undefined" ? typeof global === "undefined" ? this : global : self;
	
	//TODO: make this shim be more performant, there is some space for it
	glob.setImmediate || (glob.setImmediate = cb => setTimeout(cb, 0));
	glob.clearImmediate || (glob.clearImmediate = id => clearTimeout(id));
	
	Number.MIN_SAFE_INTEGER || (Number.MIN_SAFE_INTEGER = -0x1fffffffffffff);
	Number.MAX_SAFE_INTEGER || (Number.MAX_SAFE_INTEGER = 0x1fffffffffffff);
});