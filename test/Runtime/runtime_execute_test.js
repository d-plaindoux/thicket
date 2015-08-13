'use strict';

var stream = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/stream.js'),
    language = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/language.js')(),
    compiler = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/generator/code.js'),
    deBruijn = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/generator/deBruijn.js'),
    objcode = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/generator/objcode.js'),
    runtime = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/runtime/runtime.js')();

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
    
    runtime.register({ MODEL : [ "number", [[ "main" , [{ ACCESS : 1 }]]] ] }); 
      
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   {OBJ: [{"MODEL":["number",[[{"ACCESS":1}]],['main']]},[{"CONST":123}]]});
    test.done();
  },
    
  'String': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("'123'"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register({ MODEL : [ "string", [[ "main" , [{ ACCESS : 1 }]]] ] }); 
      
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   {OBJ: [{"MODEL":["string",[[{"ACCESS":1}]],["main"]]},[{"CONST":"123"}]]});
    test.done();
  },
    
  'Unit': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("()"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register({ MODEL : [ "unit", [] ] }); 
      
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   {OBJ: [{"MODEL":["unit",[],[]]},[]]});
    test.done();
  },
    
  'Identity': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("x -> x"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   {ENV: [ [ { ACCESS: 1 }, { RETURN: 1 } ], [] ]});
    test.done();
  }, 
    
  'Applied Identity': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(x -> x) 1"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "main" , [{ ACCESS : 1 }]]] ] }); 
      
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   {OBJ: [{"MODEL":["number",[[{"ACCESS":1}]],['main']]},[{"CONST":1}]]});
    test.done();
  }, 

  'Applied Application for TAILAPPLY': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(x y -> x y) (x -> x) 1"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "main" , [{ ACCESS : 1 }]]] ] }); 
    
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   {OBJ: [{"MODEL":["number",[[{"ACCESS":1}]],['main']]},[{"CONST":1}]]});
    test.done();
  }, 
    
  'Projection1': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("x y -> x"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   {ENV: [[{ CLOSURE: [{ ACCESS: 1 }, { RETURN: 1 }]}, { RETURN: 1 }], [] ]});
    test.done();
  }, 
    
  'Projection2': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("x y -> y"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   {ENV: [[{ CLOSURE: [{ ACCESS: 2 }, { RETURN: 1 }]}, { RETURN: 1 }], [] ]});
    test.done();
  }, 
    
  'Applied Projection1': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(x y -> x) 1 2"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "main" , [{ ACCESS : 1 }]]] ] }); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   {OBJ: [{ MODEL: [ 'number', [[{ ACCESS: 1 }]],['main']]},  [{ CONST: 1 }] ]});
    test.done();
  }, 
  
  'Applied Projection2': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(x y -> y) 1 2"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "main" , [{ ACCESS:1 }]]] ] }); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   {OBJ: [{ MODEL: [ 'number', [[{ ACCESS:1 }]],['main']]}, [{ CONST:2 }] ]});
    test.done();
  }, 
    
  'Defined function call': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("f 1"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "main" , [{ ACCESS:1 }]]] ] }); 
    runtime.register({ DEFINITION : ["f" , [{CLOSURE : [{ACCESS:1},{RETURN:1}]}]] });

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   {OBJ: [{ MODEL: [ 'number', [[{ ACCESS:1 }]],['main']]}, [{ CONST:1 }] ]});
    test.done();
  }, 
     
  'Model attribute': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("1 value"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "value" , [{ ACCESS:1 },{RETURN:1}]]] ] }); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   { CONST:1 });
    test.done();
  }, 
     
  'Model alteration': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("new A 1 with att=2 att value"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "value" , [{ ACCESS:1 },{RETURN:1}]]] ] }); 
    runtime.register({ MODEL : [ "A", [[ "att" , [{ ACCESS:1 },{RETURN:1}]]] ] }); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   { CONST:2 });
    test.done();
  }, 
     
  'Model alteration with 2 attributes and first modified and first checked': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("new A 1 2 with _1=3 _1 value"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "value" , [{ ACCESS:1 },{RETURN:1}]]] ] }); 
    runtime.register({ MODEL : [ "A", [[ "_1" , [{ ACCESS:1 },{RETURN:1}]],[ "_2" , [{ ACCESS:2 },{RETURN:1}]]] ] }); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   { CONST:3 });
    test.done();
  }, 
     
  'Model alteration with 2 attributes and first modified and second checked': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("new A 1 2 with _1=3 _2 value"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "value" , [{ ACCESS:1 },{RETURN:1}]]] ] }); 
    runtime.register({ MODEL : [ "A", [[ "_1" , [{ ACCESS:1 },{RETURN:1}]],[ "_2" , [{ ACCESS:2 },{RETURN:1}]]] ] }); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   { CONST:2 });
    test.done();
  }, 
     
  'Model alteration with 2 attributes and second modified and first checked': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("new A 1 2 with _2=3 _1 value"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "value" , [{ ACCESS:1 },{RETURN:1}]]] ] }); 
    runtime.register({ MODEL : [ "A", [[ "_1" , [{ ACCESS:1 },{RETURN:1}]],[ "_2" , [{ ACCESS:2 },{RETURN:1}]]] ] }); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   { CONST:1 });
    test.done();
  }, 
     
  'Model alteration with 2 attributes and secone modified and second checked': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("new A 1 2 with _2=3 _2 value"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "value" , [{ ACCESS:1 },{RETURN:1}]]] ] }); 
    runtime.register({ MODEL : [ "A", [[ "_1" , [{ ACCESS:1 },{RETURN:1}]],[ "_2" , [{ ACCESS:2 },{RETURN:1}]]] ] }); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   { CONST:3 });
    test.done();
  }, 
     
  'Class attribute': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("1 self this"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(expression).success();
    
    runtime.register({ CLASS : [ "number", [[ "self" , [{ ACCESS:2 },{RETURN:1}]],[ "this" , [{ ACCESS:1 },{RETURN:1}]]] ] }); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(deBruijn.indexes(source))),
                   { CONST:1 });
    test.done();
  }, 

};