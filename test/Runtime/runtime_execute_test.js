'use strict';

var stream = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/stream.js'),
    language = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/language.js')(),
    compiler = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/generator/code.js'),
    deBruijn = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/generator/deBruijn.js'),
    objcode = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/generator/objcode.js'),
    runtime = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/runtime/runtime.js')(),
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

exports['runtime_execute'] = {
  setUp: function(done) {
    done();
  },
 
  'Number': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("123"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.MODEL,["number",[["main",[[$i.ACCESS]]]]]]); 
      
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.OBJ, [[$i.MODEL,["number",[[[$i.ACCESS]]],['main']]],[[$i.CONST,123]]]]);
    test.done();
  },
    
  'String': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('"123"'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.MODEL,["string",[["main",[[$i.ACCESS]]]]]]); 
      
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.OBJ, [[$i.MODEL,["string",[[[$i.ACCESS]]],['main']]],[[$i.CONST,"123"]]]]);
    test.done();
  },
     
  'Unit': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("()"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.MODEL,["unit",[]]]); 
      
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.OBJ, [[$i.MODEL,["unit",[],[]]],[]]]);
    test.done();
  },
    
  'Identity': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("x -> x"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.ENV,[[[$i.ACCESS,1],[$i.RETURN]],[]]]);
    test.done();
  }, 
   
  'Applied Identity': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(x -> x) 1"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.MODEL,["number", [[ "main" , [[$i.ACCESS,1]]]]]]); 
      
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.OBJ, [[$i.MODEL,["number",[[[$i.ACCESS,1]]],['main']]],[[$i.CONST,1]]]]);
    test.done();
  }, 

  'Applied Application': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(x y -> x y) (x -> x) 1"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.MODEL,["number", [[ "main" , [[$i.ACCESS,1]]]]]]); 
    
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.OBJ, [[$i.MODEL,["number",[[[$i.ACCESS,1]]],['main']]],[[$i.CONST,1]]]]);
    test.done();
  }, 
    
  'Projection1': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("x y -> x"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.ENV,[[[$i.CLOSURE,[[$i.ACCESS,1], [$i.RETURN]]],[$i.RETURN]],[]]]);
    test.done();
  }, 
    
  'Projection2': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("x y -> y"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.ENV,[[[$i.CLOSURE,[[$i.ACCESS,2], [$i.RETURN]]],[$i.RETURN]],[]]]);
    test.done();
  }, 
   
  'Applied Projection1': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(x y -> x) 1 2"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.MODEL,["number", [[ "main" , [[$i.ACCESS,1]]]]]]); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.OBJ, [[$i.MODEL,["number",[[[$i.ACCESS,1]]],['main']]],[[$i.CONST,1]]]]);
    test.done();
  }, 

  'Applied Projection2': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(x y -> y) 1 2"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.MODEL,["number", [[ "main" , [[$i.ACCESS,1]]]]]]); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.OBJ, [[$i.MODEL,["number",[[[$i.ACCESS,1]]],['main']]],[[$i.CONST,2]]]]);
    test.done();
  }, 
        
  'Defined function call': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("f 1"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.MODEL,["number", [[ "main" , [[$i.ACCESS,1]]]]]]); 
    runtime.register([$i.DEFINITION,["f" , [[$i.CLOSURE, [[$i.ACCESS,1],[$i.RETURN]]]]]]);

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.OBJ, [[$i.MODEL,["number",[[[$i.ACCESS,1]]],['main']]],[[$i.CONST,1]]]]);
    test.done();
  }, 
     
  'Model attribute': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("1 value"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.MODEL,["number", [[ "value" , [[$i.ACCESS,1],[$i.RETURN]]]]]]); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.CONST,1]);
    test.done();
  }, 
    
  'Model alteration': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("new A 1 with att=2 att value"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.MODEL,["number", [[ "value" , [[$i.ACCESS,1],[$i.RETURN]]]]]]); 
    runtime.register([$i.MODEL,["A", [[ "att" , [[$i.ACCESS,1],[$i.RETURN]]]]]]); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.CONST,2]);
    test.done();
  }, 
     
  'Model alteration with 2 attributes and first modified and first checked': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("new A 1 2 with _1=3 _1 value"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.MODEL,["number", [[ "value" , [[$i.ACCESS,1],[$i.RETURN]]]]]]); 
    runtime.register([$i.MODEL,["A", [[ "_1" , [[$i.ACCESS,1],[$i.RETURN]]],[ "_2" , [[$i.ACCESS,2],[$i.RETURN]]]]]]); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.CONST,3]);
    test.done();
  }, 
     
  'Model alteration with 2 attributes and first modified and second checked': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("new A 1 2 with _1=3 _2 value"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.MODEL,["number", [[ "value" , [[$i.ACCESS,1],[$i.RETURN]]]]]]); 
    runtime.register([$i.MODEL,["A", [[ "_1" , [[$i.ACCESS,1],[$i.RETURN]]],[ "_2" , [[$i.ACCESS,2],[$i.RETURN]]]]]]); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.CONST,2]);
    test.done();
  }, 
   
  'Model alteration with 2 attributes and second modified and first checked': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("new A 1 2 with _2=3 _1 value"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.MODEL,["number", [[ "value" , [[$i.ACCESS,1],[$i.RETURN]]]]]]); 
    runtime.register([$i.MODEL,["A", [[ "_1" , [[$i.ACCESS,1],[$i.RETURN]]],[ "_2" , [[$i.ACCESS,2],[$i.RETURN]]]]]]); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.CONST,1]);
    test.done();
  }, 
     
  'Model alteration with 2 attributes and secone modified and second checked': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("new A 1 2 with _2=3 _2 value"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.MODEL,["number", [[ "value" , [[$i.ACCESS,1],[$i.RETURN]]]]]]); 
    runtime.register([$i.MODEL,["A", [[ "_1" , [[$i.ACCESS,1],[$i.RETURN]]],[ "_2" , [[$i.ACCESS,2],[$i.RETURN]]]]]]); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.CONST,3]);
    test.done();
  }, 
     
  'Class attribute': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("1 self this"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.CLASS,[ "number", [[ "self" , [[$i.ACCESS,2],[$i.RETURN]]],[ "this" , [[$i.ACCESS,1],[$i.RETURN]]]] ] ]); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.CONST,1]);
    test.done();
  }, 
     
  'Class alteration': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("new 1 with this=2 this this"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register([$i.CLASS,[ "number", [[ "this" , [[$i.ACCESS,1],[$i.RETURN]]]] ] ]); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   [$i.CONST,2]);
    test.done();
  }, 

};