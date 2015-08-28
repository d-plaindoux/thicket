'use strict';

var native = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/runtime/native.js'),
    runtime = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/runtime/runtime.js')().extendWith(native);

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
        {CONST:"Hello, World!"},{APPLY:1},
        {CONST:0},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:0});
    test.deepEqual(result, "Hello, World!");
    test.done();
      
    console.log = logger;
  },

  'numbers true comparison': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["generic.=="].concat([
        {CONST:1},{APPLY:1},
        {CONST:1},{APPLY:1},
        {CONST:true},{APPLY:1},
        {CONST:false},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:true});
    test.done();
  },
    
  'numbers false comparison': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["generic.=="].concat([
        {CONST:1},{APPLY:1},
        {CONST:2},{APPLY:1},
        {CONST:true},{APPLY:1},
        {CONST:false},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:false});
    test.done();
  },

  'strings true comparison': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["generic.=="].concat([
        {CONST:"1"},{APPLY:1},
        {CONST:"1"},{APPLY:1},
        {CONST:true},{APPLY:1},
        {CONST:false},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:true});
    test.done();
  },
    
  'strings false comparison': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["generic.=="].concat([
        {CONST:"1"},{APPLY:1},
        {CONST:"2"},{APPLY:1},
        {CONST:true},{APPLY:1},
        {CONST:false},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:false});
    test.done();
  },
   
  'numbers true <': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["generic.<"].concat([
        {CONST:1},{APPLY:1},
        {CONST:2},{APPLY:1},
        {CONST:true},{APPLY:1},
        {CONST:false},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:true});
    test.done();  },

  'numbers false <': function(test) {
      test.expect(1);
    // tests here  
    var code = runtime.delta["generic.<"].concat([
        {CONST:2},{APPLY:1},
        {CONST:1},{APPLY:1},
        {CONST:true},{APPLY:1},
        {CONST:false},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:false});
    test.done();  },
    
  'strings true <': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["generic.<"].concat([
        {CONST:"1"},{APPLY:1},
        {CONST:"2"},{APPLY:1},
        {CONST:true},{APPLY:1},
        {CONST:false},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:true});
    test.done();  
  },

  'strings false <': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["generic.<"].concat([
        {CONST:"2"},{APPLY:1},
        {CONST:"1"},{APPLY:1},
        {CONST:true},{APPLY:1},
        {CONST:false},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:false});
    test.done();  
  },
   
  'strings catenation': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["string.+"].concat([
        {CONST:"4"},{APPLY:1},
        {CONST:"2"},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:"42"});
    test.done();  
  },
    
  'string toNumber': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["string.toNumber"].concat([
        {CONST:"4"},{APPLY:1},
        {CLOSURE:[{ACCESS:1},{RETURN:1}]},{APPLY:1},
        {CONST:false},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:4});
    test.done();  
  },
        
  'string length': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["string.length"].concat([
        {CONST:"m4"},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:2});
    test.done();
  },
        
  'string wrong toNumber': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["string.toNumber"].concat([
        {CONST:"m4"},{APPLY:1},
        {CLOSURE:[{ACCESS:1},{RETURN:1}]},{APPLY:1},
        {CONST:false},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:false});
    test.done();
  },
        
  'strings hash': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["string.hash"].concat([
        {CONST:"4"},{APPLY:1},
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:52});
    test.done();
  },
 
  'numbers +': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number.+"].concat([
        {CONST:6},{APPLY:1},
        {CONST:2},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:8});
    test.done();
  },
   
  'numbers -': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number.-"].concat([
        {CONST:6},{APPLY:1},
        {CONST:2},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:4});
    test.done();
  },
   
  'numbers *': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number.*"].concat([
        {CONST:6},{APPLY:1},
        {CONST:2},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:12});
    test.done();
  },
   
  'numbers /': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number./"].concat([
        {CONST:6},{APPLY:1},
        {CONST:2},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:3});
    test.done();
  },
   
  'numbers / by zero': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number./"].concat([
        {CONST:6},{APPLY:1},
        {CONST:0},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:Infinity});
    test.done();
  },
   
  'numbers modulo': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number.%"].concat([
        {CONST:6},{APPLY:1},
        {CONST:2},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:0});
    test.done();
  },
   
  'numbers modulo by zero': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number.%"].concat([
        {CONST:6},{APPLY:1},
        {CONST:0},{APPLY:1}
    ]);      
      
    test.ok(isNaN(runtime.execute(code).CONST));
    test.done();
  },

  'numbers <<': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number.<<"].concat([
        {CONST:6},{APPLY:1},
        {CONST:2},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:6 << 2});
    test.done();
  },   

  'number toString': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["number.toString"].concat([
        {CONST:4},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:"4"});
    test.done();
  },

  'array new': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.new"].concat([
        {CONST:1},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:new Array(1)});
    test.done();
  },

  'array set': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.set"].concat([
        {CONST:new Array(1)},{APPLY:1},
        {CONST:0},{APPLY:1},
        {CONST:1},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:[ {CONST:1} ]});
    test.done();
  },

  'array set out of bound': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.set"].concat([
        {CONST:new Array(1)},{APPLY:1},
        {CONST:1},{APPLY:1},
        {CONST:1},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:new Array(1)});
    test.done();
  },
    
  'array reset': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.reset"].concat([
        {CONST:[ {CONST:1} ]},{APPLY:1},
        {CONST:0},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:new Array(1)});    
    test.done();
  },

  'array reset out of bound': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.reset"].concat([
        {CONST:[ {CONST:1} ]},{APPLY:1},
        {CONST:1},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:[ {CONST:1} ]});    
    test.done();
  },

  'array get': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.get"].concat([
        {CONST:[ {CONST:1} ]},{APPLY:1},
        {CONST:0},{APPLY:1},
        {CLOSURE:[{ACCESS:1},{RETURN:1}]},{APPLY:1},
        {CONST:false},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:1});    
    test.done();
  },

  'array get undefined': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.get"].concat([
        {CONST:new Array(1)},{APPLY:1},
        {CONST:0},{APPLY:1},
        {CLOSURE:[{ACCESS:1},{RETURN:1}]},{APPLY:1},
        {CONST:false},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:false});    
    test.done();
  },

  'array get out of bound': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.get"].concat([
        {CONST:[ {CONST:1} ]},{APPLY:1},
        {CONST:1},{APPLY:1},
        {CLOSURE:[{ACCESS:1},{RETURN:1}]},{APPLY:1},
        {CONST:false},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:false});    
    test.done();
  },

  'array size': function(test) {
    test.expect(1);
    // tests here  
    var code = runtime.delta["array.size"].concat([
        {CONST:new Array(1)},{APPLY:1}
    ]);      
      
    test.deepEqual(runtime.execute(code), {CONST:1});    
    test.done();
  },
 
};