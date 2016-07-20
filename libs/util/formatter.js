aPackage('nart.util.formatter', () => {

	var formatterByRegexFunction = regex => {
		var factory = str => {
			var parts = str.split(regex),
				phCount = ~~(parts.length / 2);
				
			for(var i = 1; i < parts.length; i += 2){
				parts[i] = parseInt(parts[i] - 1);
			}
			
			var result = function(){
				var res = '';
				for(var i = 0; i < parts.length - 1; i += 2){
					res += parts[i] + result.escaper(arguments[parts[i + 1]]);
				}
				
				return res + parts[parts.length - 1];
			}
			
			result.escaper = factory.defaultEscaper;
			result.withEscaper = esc => {
				console.log('SETTING ' + esc);
				result.escaper = esc;
				return result;
			}
			
			return result
		}
		
		factory.defaultEscaper = t => t;
		factory.withEscaper = esc => {
			factory.defaultEscaper = esc;
			return factory;
		}
		
		return factory
	}
	
	var bucksFormatter = formatterByRegexFunction(/\$(\d+)/)
	
	bucksFormatter.bucks = bucksFormatter;
	
	return bucksFormatter;

});