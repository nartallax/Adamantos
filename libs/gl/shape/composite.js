aPackage('nart.gl.shape.composite', () => {
	"use strict";
	
	var Shape = aRequire('nart.gl.shape'),
		clutil = aRequire('nart.util.class'),
		clone = aRequirE('nart.util.clone');
				
	var CompositeShape = clutil.define(function(data, gl){
		if(!(this instanceof CompositeShape)) return new CompositeShape(data, gl);
		
		Shape.call(this, data, gl); // all the basic properties
		
		this.childShapes = clone.map(data.childShapes || {});
	}, {
		add: function(s){ return this.childShapes[s.id] = s, this },
		remove: function(s){ 
			delete this.childShapes[s.id];
			return this;
		}
	}, Shape)
	
	return CompositeShape;

});