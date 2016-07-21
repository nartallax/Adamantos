aPackage('nart.omnipresent.class', () => {
	"use strict";
	
	var getProtoInstanceFunction = cstr => {
		var FakeConstr = function(){}
		FakeConstr.prototype = (cstr || function(){}).prototype;
			
		return mix => {
			var result = cstr? new FakeConstr(): {};
			mix && Object.keys(mix).forEach(key => result[key] = mix[key])
			return result;
		}
	}
	
	var defineClass = (constr, mix, protoConstr) => {
		if((constr && typeof(constr.prototype) !== 'function')){
			fail('Failed to define a class: passed constructor value is not a function: ' + constr);
		}
		
		if(mix && typeof(mix) !== 'object'){
			fail('Failed to define a class: passed mix is not an object: ' + mix);
		}
		
		protoConstr = protoConstr || function(){};
		mix = mix || {};
		
		var realConstr = constr || function(){};
		var pseudoConstr = function(){
			if(!(this instanceof pseudoConstr)) {
				// we may want to call this function as constructor here
				// but i'm not aware of any effective approach of that
				// best thing i've managed to code slows object creation x1.5; that is... not too bad, but not good either
				// so, better just eliminate such calls, as they are uneffective and errorneous.
				// (checking with instanceof doesn't slow us much though)
				fail('Constructor function is called as ordinary function; that is not allowed.');
			}
			// we better do not use 'arguments' here
			// as long as it's famous performance killer (due to de-opt)
			// if someone ever got stuck with parameter count, it's better just to increase the count
			// surprisingly, it don't significantly affect performance (maybe because of inlining?)
			realConstr.call(this, a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,x,t,u,v,w,s,y,z);
		}
		
		pseudoConstr.prototype = protoConstr.getProtoInstance(mix);
		pseudoConstr.prototype.class = pseuoConstr.class = pseudoConstr;
		pseudoConstr.prototype.super = pseuoConstr.super = protoConstr;
		pseudoConstr.prototype.derive = pseuoConstr.derive = (newConstr, newMix) => defineClass(newConstr, newMix, pseudoConstr);
		pseudoConstr.prototype.getProtoInstance = pseuoConstr.getProtoInstance = getProtoInstanceFunction(pseudoConstr);
		
		return pseuoConstr;
	};
	
	// the one and the only way of creating new class - derive()ing from some known class
	// if there is no obvious ancestor - then Object is to be inherited of
	Object.derive = (newConstr, newMix) => defineClass(newConstr, newMix, null);
	Object.getProtoInstance = getProtoInstanceFunction(null);
	
	Function.getProtoInstance = getProtoInstanceFunction(null);

});