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
	/*
	var getRotations = (dx, dy, dz) => {
		var dist = Math.sqrt(Math.sqrt((dx * dx) + (dy * dy)) + (dz * dz));
		
		var sx = dx / dist, sy = dy / dist, sz = dz / dist;
		
		var ax = 
	}
	*/
	BonePositioning.prototype = {
		getDefaultValue: function(){ return this.def },
		
		getPosition: function(valA, valB, percentage, otherPositions){
			/*
			var finVal = valA + ((valA - valB) * percentage);
			
			var dist = this.shiftX;
			dist = Math.sqrt((dist * dist) + (this.shiftY * this.shiftY))
			dist = Math.sqrt((dist * dist) + (this.shiftZ * this.shiftZ))
			
			var parentPos = otherPositions[this.parent];
			if(!parentPos) throw new Error('Could not calc position of bone: must calc position of "' + parentPos + '" first.');
			
			var r = {
				x: parentPos.x,
				y: parentPos.y,
				z: parentPos.z,
				
				rotX: parentPos.rotX,
				rotY: parentPos.rotY,
				rotZ: parentPos.rotZ
			};
			
			var iSinX = this.shiftX / dist, iSinY = this.shiftY / dist, iSinZ = this.shiftZ / dist;
			*/
			throw 'Not implemented'
			
		},
		
		getProcessingOrder: function(otherParts){
			return otherParts[this.parent].getProcessingOrder() + 1
		}
	};
	
	return BonePositioning;
	
});