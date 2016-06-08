// тупое позиционирование по координатам
aPackage('nart.gl.model.positioning.absolute', () => {
	
	var AbsolutePositioning = function(x, y, z, rotX, rotY, rotZ){
		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;
		this.rotX = rotX || 0;
		this.rotY = rotY || 0;
		this.rotZ = rotZ || 0;
	}
	
	var avg = (a, b, percentage) => a + ((b - a) * percentage)
	
	AbsolutePositioning.prototype = {
		getDefaultValue: function(){
			return {x: this.x, y: this.y, z: this.z}
		},
		
		getPosition: function(valA, valB, percentage, otherPositions){
			return {
				x: avg(valA.x, valB.x, percentage),
				y: avg(valA.y, valB.y, percentage),
				z: avg(valA.z, valB.z, percentage),
				rotX: avg(valA.rotX, valB.rotY, percentage),
				rotY: avg(valA.rotY, valB.rotY, percentage),
				rotZ: avg(valA.rotZ, valB.rotZ, percentage)
			}
		}
	};
	
	return AbsolutePositioning;
	
});