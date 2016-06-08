aPackage('nart.gl.model.part', () => {

	var Part = function(model, shape, pos){
		this.model = model;
		shape && this.setShape(shape);
		pos && this.setPositioning(pos);		
	};
	
	Part.prototype = {
		setShape: function(shape){
			this.shape = shape;
			return this;
		},
		setPositioning: function(pos){
			this.positioning = pos;
		}
	}

	return Part;
	
});