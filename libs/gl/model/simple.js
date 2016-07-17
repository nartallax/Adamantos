/*
модель - совокупность шейпов и данных об их положении
также модель позволяет их анимировать

задается следующим образом:
1. модель заполняется шейпами; у каждого шейпа есть 
	* имя, по которому к нему можно обращаться
	* тип анимации, определяющий, как следует интерпретировать значения фреймов анимации для данного шейпа
	* изначальное положение шейпа
2. в модели задаются анимации.
	анимация есть
	* приоритет анимации, определяющий, значение какой из анимаций должно быть использовано,
		если шейп пытаются "двигать" более одной анимации одновременно
	* последовательность имен шейпов, участвующих в анимации; индекс имеет значение, см.ниже.
	* последовательность фреймов анимации. фрейм анимации - это:
		* величина задержки относительно предыдущего фрейма анимации, в мсек
		* значения анимации для шейпов, участвующих в данной анимации. значения соотносятся с шейпами по индексу.
		
Последовательность фреймов должна формировать законченную (замкнутую) анимацию.
Для получения значения анимации между фреймами применяется линейная интерполяция значений анимации для соседних фреймов.
		
типов анимации (на данный момент) два:
1. абсолютная: позиция шейпа задается смещением относительно (0, 0, 0) модели
	изначальное положение шейпа задается координатами относительно нуля
2. bones (анимация костями): позиция шейпа задается одним значением; это значение - угол поворота шейпа относительно того шейпа, к которому он крепится
	изначальное положение шейпа задается именем другого шейпа, смещением нуля этого шейпа относительно нуля другого шейпа и осью вращения (ось вращения - 3 числа, определяющих, насколько влияет угол наклона шейпа на поворот его относительно x, y и z); точка вращения - ноль этого шейпа
*/
aPackage('nart.gl.model.simple', () => {

	var defineClass = aRequire('nart.util.class').define,
		DynamicResource = aRequire('nart.gl.resource.resource.dynamic'),
		Shape = aRequire('nart.gl.shape');

	var Model = defineClass(function(data){
		if(!(this instanceof Model)) return new Model(data);
		
		this.parts = {};
		this.animations = {};
		
		DynamicResource.call(this);
	}, {
		eachAnimation: function(cb){ Object.keys(this.animations).forEach(name => cb(this.animations[name], name)); },
		eachPart: function(cb){ Object.keys(this.parts).forEach(name => cb(this.parts[name], name)); },
		
		addPart: function(name, shape, pos){ 
			return this.parts[name] = new Part(this, shape, pos);
		},
		addAnimation: function(name, parts, frames){
			return this.animations[name] = new Animation(this, parts, frames);
		},
		
		getPart: function(name){ 
			var part = this.parts[name];
			if(!part) throw new Error('There is no part named "' + name + '".');
			return part;
		},
		getAnimation: function(name){
			var a = this.animations[name];
			if(!a) throw new Error('There is no animation named "' + name + '".');
			return a;
		},
		
		removePart: function(name){
			delete this.parts[name];
			
			this.eachAnimation(a => a.removePart(name));
		},
		renamePart: function(oldName, newName){ 
			this.parts[newName] = this.getPart(oldName);
			delete this.parts[oldName];
			
			this.eachAnimation(a => a.renamePart(oldName, newName));
		}
	}, DynamicResource)
	
	return Model;

});