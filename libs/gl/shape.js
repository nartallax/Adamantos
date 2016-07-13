aPackage('nart.gl.shape', () => {
	"use strict"
				
	var defineClass = aRequire('nart.util.class').define,
		mat4 = aRequire('nart.gl.external.matrix').mat4,
		Resource = aRequire('nart.gl.resource.resource');
		
	var Shape = defineClass(function(gl){
		if(!(this instanceof Shape)) return new Shape(data);
		
		this.gl = gl;
		
		this.matrix = mat4.identity([]);
		
		Resource.call(this);
	}, {
		clone: function(){ return new this.class(this) },
		
		// rotation and translation properties should not be set directly
		// as the only way for them to take effect is to alter the matrix
		// though they are stored separately as we could not truly extract them from matrix
		setMatrix: function(mat){ mat4.set(mat, this.matrix) },
		getMatrix: function(){ return this.matrix },
	
		// rotations
		rotateX: function(v){ mat4.rotate(this.matrix, v, [1, 0, 0]), (this.rotX += v) },
		rotateY: function(v){ mat4.rotate(this.matrix, v, [0, 1, 0]), (this.rotY += v) },
		rotateZ: function(v){ mat4.rotate(this.matrix, v, [0, 0, 1]), (this.rotZ += v) },
		
		setRotationX: function(v){ this.rotateX(-this.rotX), this.rotateX(this.rotX = v) },
		setRotationY: function(v){ this.rotateY(-this.rotY), this.rotateY(this.rotY = v) },
		setRotationZ: function(v){ this.rotateZ(-this.rotZ), this.rotateZ(this.rotZ = v) },
		
		getRotationX: function(){ return this.rotX },
		getRotationY: function(){ return this.rotY },
		getRotationZ: function(){ return this.rotZ },
		
		// translations
		move: function(x, y, z){ (x || y || z) && (mat4.translate(this.matrix, [x, y, z]), (this.x += x), (this.y += y), (this.z += z)) },
		moveX: function(x){ x && (mat4.translate(this.matrix, [x, 0, 0]), (this.x += x)) },
		moveY: function(y){ y && (mat4.translate(this.matrix, [0, y, 0]), (this.y += y)) },
		moveZ: function(z){ z && (mat4.translate(this.matrix, [0, 0, z]), (this.z += z)) },
		
		setPosition: function(x, y, z){ this.move(-this.x, -this.y, -this.z), this.move(this.x = x, this.y = y, this.z = z) },
		setX: function(x){ this.moveX(-this.x), this.moveX(this.x = x) },
		setY: function(y){ this.moveY(-this.y), this.moveY(this.y = y) },
		setZ: function(z){ this.moveZ(-this.z), this.moveZ(this.z = z) },
		
		getX: function(){ return this.x },
		getY: function(){ return this.y },
		getZ: function(){ return this.z }
	}, Resource);
	
	return Shape;
	
});