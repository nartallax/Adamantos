aPackage('nart.gl.shape', () => {
	"use strict"
				
	var defineClass = aRequire('nart.util.class').define;
				
	var getId = (() => {
		var i = -0x8fffffff;
		return () => ++i
	})();

	var Shape = defineClass(function(data){
		if(!(this instanceof Shape)) return new Shape(data);
		
		this.gl = data.gl;
		
		this.x = data.x || 0;
		this.y = data.y || 0;
		this.z = data.z || 0;
		
		this.rotX = data.rotX || 0;
		this.rotY = data.rotY || 0;
		this.rotZ = data.rotZ || 0;
		
		/*
		this.sizeX = this.getXSize();
		this.sizeY = this.getYSize();
		this.sizeZ = this.getZSize();
		*/
		this.id = getId();
	}, {
		clone: function(){ return new this.class(this) },
		/*
		getXSize: function(){ throw 'Not implemented.' },
		getYSize: function(){ throw 'Not implemented.' },
		getZSize: function(){ throw 'Not implemented.' }
		*/
	})
	
	return Shape;
	
});