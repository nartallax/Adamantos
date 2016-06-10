// позиционирование с помощью поворота и смещения относительно другого сегмента
aPackage('nart.gl.model.positioning.bone', () => {
	
	var BonePositioning = function(parent, x, y, z, defaultValue){
		this.parent = parent || '';
		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;
		this.def = defaultValue || 0;
	};
	
	BonePositioning.prototype = {
		getDefaultValue: function(){ return this.def },
		
		getPosition: function(valA, valB, percentage, otherPositions){
			throw new Error('WOOT');
		},
		
		getProcessingOrder: function(otherParts){
			return otherParts[this.parent].getProcessingOrder() + 1
		}
	};
	
	return BonePositioning;
	
});