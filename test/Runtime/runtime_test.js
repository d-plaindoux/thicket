'use strict';

var stream = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/stream.js'),
    list = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/list.js'),    
    language = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/syntax/language.js')(),
    compiler = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/generator/code.js'),
    objcode = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/generator/objcode.js'),
    runtime = require('../../lib' + (process.env.THICKET_COV || '') + '/Runtime/runtime.js');  

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

exports['runtime'] = {
  setUp: function(done) {
    done();
  },
 
  'Number': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("123"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "_" , [{ ACCESS : 1 }]]] ] }); 
      
    test.deepEqual(runtime.execute(objcode.generateObjCode(objcode.deBruijnIndex(source))),
                    {OBJ: [{"MODEL":["number",[["_",[{"ACCESS":1}]]]]},[{"CONST":123}]]});
    test.done();
  },
    
  'String': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("'123'"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
    
    runtime.register({ MODEL : [ "string", [[ "_" , [{ ACCESS : 1 }]]] ] }); 
      
    test.deepEqual(runtime.execute(objcode.generateObjCode(objcode.deBruijnIndex(source))),
                    {OBJ: [{"MODEL":["string",[["_",[{"ACCESS":1}]]]]},[{"CONST":"123"}]]});
    test.done();
  },
    
  'Unit': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("()"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
    
    runtime.register({ MODEL : [ "unit", [] ] }); 
      
    test.deepEqual(runtime.execute(objcode.generateObjCode(objcode.deBruijnIndex(source))),
                   {OBJ: [{"MODEL":["unit",[]]},[]]});
    test.done();
  },
    
  'Identity': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("x -> x"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
    
    test.deepEqual(runtime.execute(objcode.generateObjCode(objcode.deBruijnIndex(source))),
                   {ENV: [ [ { ACCESS: 1 }, { RETURN: 1 } ], [] ]});
    test.done();
  }, 
    
  'Applied Identity': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(x -> x) ()"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
    
    runtime.register({ MODEL : [ "unit", [] ] }); 
    
    test.deepEqual(runtime.execute(objcode.generateObjCode(objcode.deBruijnIndex(source))),
                   {OBJ: [{"MODEL":["unit",[]]},[]]});
    test.done();
  }, 

  'Applied Application for TAILAPPLY': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(x y -> x y) (x -> x) ()"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
    
    runtime.register({ MODEL : [ "unit", [] ] }); 
    
    test.deepEqual(runtime.execute(objcode.generateObjCode(objcode.deBruijnIndex(source))),
                   {OBJ: [{"MODEL":["unit",[]]},[]]});
    test.done();
  }, 
    
  'Projection1': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("x y -> x"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
    
    test.deepEqual(runtime.execute(objcode.generateObjCode(objcode.deBruijnIndex(source))),
                   {ENV: [[{ CLOSURE: [{ ACCESS: 1 }, { RETURN: 1 }]}, { RETURN: 1 }], [] ]});
    test.done();
  }, 
    
  'Projection2': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("x y -> y"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
    
    test.deepEqual(runtime.execute(objcode.generateObjCode(objcode.deBruijnIndex(source))),
                   {ENV: [[{ CLOSURE: [{ ACCESS: 2 }, { RETURN: 1 }]}, { RETURN: 1 }], [] ]});
    test.done();
  }, 
    
  'Applied Projection1': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(x y -> x) 1 2"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "_" , [{ ACCESS : 1 }]]] ] }); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(objcode.deBruijnIndex(source))),
                   {OBJ: [{ MODEL: [ 'number', [[ '_', [{ ACCESS: 1 }]]]]},  [{ CONST: 1 }] ]});
    test.done();
  }, 
  
  'Applied Projection2': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(x y -> y) 1 2"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "_" , [{ ACCESS:1 }]]] ] }); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(objcode.deBruijnIndex(source))),
                   {OBJ: [{ MODEL: [ 'number', [[ '_', [{ ACCESS:1 }]]]]}, [{ CONST:2 }] ]});
    test.done();
  }, 
    
  'Defined function call': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("f 1"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "_" , [{ ACCESS:1 }]]] ] }); 
    runtime.register({ DEFINITION : ["f" , [{CLOSURE : [{ACCESS:1},{RETURN:1}]}]] });

    test.deepEqual(runtime.execute(objcode.generateObjCode(objcode.deBruijnIndex(source))),
                   {OBJ: [{ MODEL: [ 'number', [[ '_', [{ ACCESS:1 }]]]]}, [{ CONST:1 }] ]});
    test.done();
  }, 
     
  'Model attribute': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("1 value"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
    
    runtime.register({ MODEL : [ "number", [[ "value" , [{ ACCESS:1 },{RETURN:1}]]] ] }); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(objcode.deBruijnIndex(source))),
                   { CONST:1 });
    test.done();
  }, 
     
  'Class attribute': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("1 id value"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
    
    runtime.register({ CLASS : [ "number", [[ "id" , [{ ACCESS:2 },{RETURN:1}]],[ "value" , [{ ACCESS:1 },{RETURN:1}]]] ] }); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(objcode.deBruijnIndex(source))),
                   { CONST:1 });
    test.done();
  }, 
     
  'View rendering': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("1"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
    
    runtime.register({ VIEW : [ "number", [{ACCESS:1},{RETURN:1}] ] }); 

    test.deepEqual(runtime.execute(objcode.generateObjCode(objcode.deBruijnIndex(source))),
                   { CONST:1 });
    test.done();
  }, 
};