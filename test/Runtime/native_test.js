'use strict';

var native = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/runtime/native.js'),
    runtime = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/runtime/runtime.js')().extendWith(native),
    $i = runtime.instruction;

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['native'] = {
  setUp: function(done) {
    done();
  },
       
  'console call': function(test) {
    var logger = console.log,
        result = null;
      
    test.expect(2);
    // tests here 
      
    console.log = function(s) {
        result = s;
    };
      
    var code = runtime.delta["console.log"].concat([
        [$i.CONST,"Hello, World!"],[$i.APPLY],
        [$i.CONST,0],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,0]);
    test.deepEqual(result, "Hello, World!");
    test.done();
      
    console.log = logger;
  },

  'numbers true comparison': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["generic.=="].concat([
        [$i.CONST,1],[$i.APPLY],
        [$i.CONST,1],[$i.APPLY],
        [$i.CONST,true],[$i.APPLY],
        [$i.CONST,false],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,true]);
    test.done();
  },
    
  'numbers false comparison': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["generic.=="].concat([
        [$i.CONST,1],[$i.APPLY],
        [$i.CONST,2],[$i.APPLY],
        [$i.CONST,true],[$i.APPLY],
        [$i.CONST,false],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,false]);
    test.done();
  },

  'strings true comparison': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["generic.=="].concat([
        [$i.CONST,"1"],[$i.APPLY],
        [$i.CONST,"1"],[$i.APPLY],
        [$i.CONST,true],[$i.APPLY],
        [$i.CONST,false],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,true]);
    test.done();
  },
    
  'strings false comparison': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["generic.=="].concat([
        [$i.CONST,"1"],[$i.APPLY],
        [$i.CONST,"2"],[$i.APPLY],
        [$i.CONST,true],[$i.APPLY],
        [$i.CONST,false],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,false]);
    test.done();
  },
   
  'numbers true <': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["generic.<"].concat([
        [$i.CONST,1],[$i.APPLY],
        [$i.CONST,2],[$i.APPLY],
        [$i.CONST,true],[$i.APPLY],
        [$i.CONST,false],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,true]);
    test.done();  },

  'numbers false <': function(test) {
      test.expect(1);
    // tests here  
    var code = runtime.delta["generic.<"].concat([
        [$i.CONST,2],[$i.APPLY],
        [$i.CONST,1],[$i.APPLY],
        [$i.CONST,true],[$i.APPLY],
        [$i.CONST,false],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,false]);
    test.done();  },
    
  'strings true <': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["generic.<"].concat([
        [$i.CONST,"1"],[$i.APPLY],
        [$i.CONST,"2"],[$i.APPLY],
        [$i.CONST,true],[$i.APPLY],
        [$i.CONST,false],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,true]);
    test.done();  
  },

  'strings false <': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["generic.<"].concat([
        [$i.CONST,"2"],[$i.APPLY],
        [$i.CONST,"1"],[$i.APPLY],
        [$i.CONST,true],[$i.APPLY],
        [$i.CONST,false],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,false]);
    test.done();  
  },
   
  'strings catenation': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["string.+"].concat([
        [$i.CONST,"4"],[$i.APPLY],
        [$i.CONST,"2"],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,"42"]);
    test.done();  
  },
    
  'string toNumber': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["string.toNumber"].concat([
        [$i.CONST,"4"],[$i.APPLY],
        [$i.CLOSURE,[[$i.ACCESS,1],[$i.RETURN]]],[$i.APPLY],
        [$i.CONST,false],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,4]);
    test.done();  
  },
        
  'string wrong toNumber': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["string.toNumber"].concat([
        [$i.CONST,"m4"],[$i.APPLY],
        [$i.CLOSURE,[[$i.ACCESS,1],[$i.RETURN]]],[$i.APPLY],
        [$i.CONST,false],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,false]);
    test.done();
  },
        
  'string length': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["string.length"].concat([
        [$i.CONST,"m4"],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,2]);
    test.done();
  },
        
  'strings hash': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["string.hash"].concat([
        [$i.CONST,"4"],[$i.APPLY],
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,52]);
    test.done();
  },
    
  'char +': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["char.+"].concat([
        [$i.CONST,"A"],[$i.APPLY],
        [$i.CONST,1],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,"B"]);
    test.done();  
  },
    
  'string + (2)': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["char.+"].concat([
        [$i.CONST,"B"],[$i.APPLY],
        [$i.CONST,-1],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,"A"]);
    test.done();  
  },
    
  'string setAt': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["string.setAt"].concat([
        [$i.CONST,"A"],[$i.APPLY],
        [$i.CONST,0],[$i.APPLY],
        [$i.CONST,"B"],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,"B"]);
    test.done();  
  },
    
  'string setAt (2)': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["string.setAt"].concat([
        [$i.CONST,"ABC"],[$i.APPLY],
        [$i.CONST,1],[$i.APPLY],
        [$i.CONST,"D"],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,"ADC"]);
    test.done();  
  },
    
  'string setAt outofindex': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["string.setAt"].concat([
        [$i.CONST,"A"],[$i.APPLY],
        [$i.CONST,1],[$i.APPLY],
        [$i.CONST,"B"],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,"A"]);
    test.done();  
  },
         
  'string getAt': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["string.getAt"].concat([
        [$i.CONST,"4"],[$i.APPLY],
        [$i.CONST,"0"],[$i.APPLY],
        [$i.CLOSURE,[[$i.ACCESS,1],[$i.RETURN]]],[$i.APPLY],
        [$i.CONST,false],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,"4"]);
    test.done();  
  },

  'string getAt outofindex': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["string.getAt"].concat([
        [$i.CONST,"4"],[$i.APPLY],
        [$i.CONST,"1"],[$i.APPLY],
        [$i.CLOSURE,[[$i.ACCESS,1],[$i.RETURN]]],[$i.APPLY],
        [$i.CONST,false],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,false]);
    test.done();  
  },
 
  'numbers +': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number.+"].concat([
        [$i.CONST,6],[$i.APPLY],
        [$i.CONST,2],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,8]);
    test.done();
  },
   
  'numbers -': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number.-"].concat([
        [$i.CONST,6],[$i.APPLY],
        [$i.CONST,2],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,4]);
    test.done();
  },
   
  'numbers *': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number.*"].concat([
        [$i.CONST,6],[$i.APPLY],
        [$i.CONST,2],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,12]);
    test.done();
  },
   
  'numbers /': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number./"].concat([
        [$i.CONST,6],[$i.APPLY],
        [$i.CONST,2],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,3]);
    test.done();
  },
   
  'numbers / by zero': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number./"].concat([
        [$i.CONST,6],[$i.APPLY],
        [$i.CONST,0],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,Infinity]);
    test.done();
  },
   
  'numbers modulo': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number.%"].concat([
        [$i.CONST,6],[$i.APPLY],
        [$i.CONST,2],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,0]);
    test.done();
  },
   
  'numbers modulo by zero': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number.%"].concat([
        [$i.CONST,6],[$i.APPLY],
        [$i.CONST,0],[$i.APPLY]
    ]);      
      
    test.ok(isNaN(runtime.execute(code).CONST));
    test.done();
  },

  'numbers <<': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number.<<"].concat([
        [$i.CONST,6],[$i.APPLY],
        [$i.CONST,2],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,6 << 2]);
    test.done();
  },   

  'number toString': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number.toString"].concat([
        [$i.CONST,4],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,"4"]);
    test.done();
  },

  'array new': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.new"].concat([
        [$i.CONST,1],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,new Array(1)]);
    test.done();
  },

  'array set': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.set"].concat([
        [$i.CONST,new Array(1)],[$i.APPLY],
        [$i.CONST,0],[$i.APPLY],
        [$i.CONST,1],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,[ [$i.CONST,1] ]]);
    test.done();
  },

  'array set out of bound': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.set"].concat([
        [$i.CONST,new Array(1)],[$i.APPLY],
        [$i.CONST,1],[$i.APPLY],
        [$i.CONST,1],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,new Array(1)]);
    test.done();
  },
    
  'array reset': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.reset"].concat([
        [$i.CONST,[ [$i.CONST,1] ]],[$i.APPLY],
        [$i.CONST,0],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,new Array(1)]);    
    test.done();
  },

  'array reset out of bound': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.reset"].concat([
        [$i.CONST,[ [$i.CONST,1] ]],[$i.APPLY],
        [$i.CONST,1],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,[ [$i.CONST,1] ]]);    
    test.done();
  },

  'array get': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.get"].concat([
        [$i.CONST,[ [$i.CONST,1] ]],[$i.APPLY],
        [$i.CONST,0],[$i.APPLY],
        [$i.CLOSURE,[[$i.ACCESS,1],[$i.RETURN]]],[$i.APPLY],
        [$i.CONST,false],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,1]);    
    test.done();
  },

  'array get undefined': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.get"].concat([
        [$i.CONST,new Array(1)],[$i.APPLY],
        [$i.CONST,0],[$i.APPLY],
        [$i.CLOSURE,[[$i.ACCESS,1],[$i.RETURN]]],[$i.APPLY],
        [$i.CONST,false],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,false]);    
    test.done();
  },

  'array get out of bound': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.get"].concat([
        [$i.CONST,[ [$i.CONST,1] ]],[$i.APPLY],
        [$i.CONST,1],[$i.APPLY],
        [$i.CLOSURE,[[$i.ACCESS,1],[$i.RETURN]]],[$i.APPLY],
        [$i.CONST,false],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,false]);    
    test.done();
  },

  'array size': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.size"].concat([
        [$i.CONST,new Array(1)],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,1]);    
    test.done();
  },
    
  'mutable new': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["mutable.new"].concat([
        [$i.CONST,1],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,{value:[$i.CONST,1]}]);
    test.done();
  },
    
  'mutable get': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["mutable.get"].concat([
        [$i.CONST,{value:[$i.CONST,1]}],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,1]);
    test.done();
  },
    
  'mutable set': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["mutable.set"].concat([
        [$i.CONST,{value:[$i.CONST,1]}],[$i.APPLY],
        [$i.CONST,2],[$i.APPLY]
    ]);      
      
    test.deepEqual(runtime.execute(code), [$i.CONST,{value:[$i.CONST,2]}]);
    test.done();
  },
 
};