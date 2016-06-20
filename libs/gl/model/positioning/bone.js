// позиционирование с помощью поворота и смещения относительно другого сегмента
aPackage('nart.gl.model.positioning.bone', () => {
	
	var BonePositioning = function(parent, shiftX, shiftY, shiftZ, multX, multY, multZ, defaultValue){
		this.parent = parent || '';
		
		this.shiftX = shiftX || 0;
		this.shiftY = shiftY || 0;
		this.shiftZ = shiftZ || 0;
		
		this.multX = multX || 0;
		this.multY = multY || 0;
		this.multZ = multZ || 0;
		
		this.def = defaultValue || 0;
	};
	
	var dist = (a, b) => Math.sqrt((a * a) + (b * b))
	
	var getTransformedPoint = (dx, dy, dz, rotX, rotY, rotZ) => {
		var totalDist = dist(dist(dx, dy), dz);
		
		rotX += Math.acos(dz / dist(dy, dz));
		rotY += Math.acos(dz / dist(dx, dz));
		rotZ += Math.acos(dx / dist(dy, dx));
		
		dx = totalDist
		
		return {
			x: (totalDist * Math.cos(Math.sin(rotZ) * ((Math.PI / 2) - rotY))) * Math.cos(rotZ),
			y: (totalDist * Math.cos(Math.sin(rotY) * rotX)) * Math.cos(Math.sin(rotY) * rotX)),
			z: (totalDist * Math.cos(Math.sin(rotX) * rotY)) * Math.cos(rotX)
		};
	}
	
	BonePositioning.prototype = {
		getDefaultValue: function(){ return this.def },
		
		getPosition: function(valA, valB, percentage, otherPositions){
			var finVal = valA + ((valA - valB) * percentage);
			
			var parentPos = otherPositions[this.parent];
			if(!parentPos) throw new Error('Could not calc position of bone: must calc position of "' + this.parent + '" first.');
			
			var r = {
				x: parentPos.x,
				y: parentPos.y,
				z: parentPos.z,
				
				rotX: parentPos.rotX,
				rotY: parentPos.rotY,
				rotZ: parentPos.rotZ
			};
			
			
			
			throw 'Not implemented'
			
		},
		
		getProcessingOrder: function(otherParts){
			return otherParts[this.parent].getProcessingOrder() + 1
		}
	};
	
	return BonePositioning;
	
});