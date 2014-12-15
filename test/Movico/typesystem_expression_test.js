'use strict';

var typesystem = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/typesystem.js').typesystem,
    entities = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/entities.js').entities,
    ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/ast.js').ast,
    pair = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/pair.js').pair;
    

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
    test.(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['typesystem_expression'] = {
  setUp: function(done) {
    done();
  },
    
  '1 must be an int': function(test) {
    test.expect(1);
    // tests here  
    var aTypeSystem = typesystem(entities());  
      
    test.deepEqual(aTypeSystem.expression([], ast.expr.number(1)).success()._2, 
                   ast.type.native('int'), 
                   "type must be an int");
    test.done();                
  },
    
  '"1" must be a string': function(test) {
    test.expect(1);
    // tests here  
    var aTypeSystem = typesystem(entities());  
      
    test.deepEqual(aTypeSystem.expression([], ast.expr.string("1")).success()._2, 
                   ast.type.native('string'),
                   "type must be a string");
    test.done();                
  },
    
  'ident in environment': function(test) {
    test.expect(1);
    // tests here  
    var aTypeSystem = typesystem(entities());  
      
    test.deepEqual(aTypeSystem.expression([pair("a",ast.type.native('A'))], ast.expr.ident("a")).success()._2, 
                   ast.type.native('A'), 
                   "type must be defined");
    test.done();                
  },
    
  'ident not in environment': function(test) {
    test.expect(1);
    // tests here  
    var aTypeSystem = typesystem(entities());  
      
    test.ok(aTypeSystem.expression([], ast.expr.ident("a")).isFailure(), 
            "type must not be defined");
    test.done();                
  },
    
  'ident in entities': function(test) {
    test.expect(1);
    // tests here  
    var aTypeSystem = typesystem(entities().declare(ast.model('a',[])));  
      
    test.deepEqual(aTypeSystem.expression([], ast.expr.ident("a")).success()._2, 
                   ast.model('a',[]), 
                   "type must be defined");
    test.done();                
  },
    
  'checking empty model': function(test) {
    test.expect(1);
    // tests here  
    var aTypeSystem = typesystem(entities().declare(ast.model('a',[],[])));  
      
    test.deepEqual(aTypeSystem.expression([], ast.expr.instance("a",[])).success()._2, 
                   ast.model('a',[], []), 
                   "type must be defined");
    test.done();                
  },
    
  'checking model with no arguments and parameters': function(test) {
    test.expect(1);
    // tests here  
    var aTypeSystem = typesystem(entities().declare(ast.model('a',[],[["a",ast.type.native('int')]])));  
      
    test.ok(aTypeSystem.expression([], ast.expr.instance("a",[])).isFailure(), 
            "type cannot be infered");
    test.done();                
  },
    
  'checking model with arguments and no parameters': function(test) {
    test.expect(1);
    // tests here  
    var aTypeSystem = typesystem(entities().declare(ast.model('a',[],[])));  
      
    test.ok(aTypeSystem.expression([], ast.expr.instance("a",[ast.expr.number(1)])).isFailure(), 
            "type cannot be infered");
    test.done();                
  },
    
  'checking model with arguments and parameters': function(test) {
    test.expect(1);
    // tests here  
    var aTypeSystem = typesystem(entities().declare(ast.model('a',[], [["a",ast.type.native('int')]])));  
      
    test.deepEqual(aTypeSystem.expression([], ast.expr.instance("a",[ast.expr.number(1)])).success()._2, 
                   ast.model('a',[],[["a",ast.type.native('int')]]),
                   "type can be infered");
    test.done();                
  },
    
  'checking pair': function(test) {
    test.expect(1);
    // tests here  
    var aTypeSystem = typesystem(entities());  
      
    test.deepEqual(aTypeSystem.expression([], ast.expr.pair(ast.expr.number(1), ast.expr.string("a"))).success()._2, 
                   ast.type.pair(ast.type.native("int"),ast.type.native("string")),
                   "type can be infered");
    test.done();                
  },
    
  'checking function': function(test) {
    test.expect(1);
    // tests here  
    var aTypeSystem = typesystem(entities());  
      
    test.deepEqual(aTypeSystem.expression([], ast.expr.abstraction([ast.param("x",ast.type.native("int"))], ast.expr.ident("x"))).success()._2, 
                   ast.type.abstraction(ast.type.native("int"),ast.type.native("int")),
                   "type can be infered");
    test.done();                
  },
    
  'checking application': function(test) {
    test.expect(1);
    // tests here  
    var aTypeSystem = typesystem(entities());  
      
    test.deepEqual(aTypeSystem.expression([], ast.expr.application(ast.expr.abstraction([ast.param("x",ast.type.native("int"))], ast.expr.ident("x")) ,
                                                                    ast.expr.number(1))
                                          ).success()._2, 
                   ast.type.native("int"),
                   "type can be infered");
    test.done();                
  },
    
  'checking wrong application': function(test) {
    test.expect(1);
    // tests here  
    var aTypeSystem = typesystem(entities());  
      
    test.ok(aTypeSystem.expression([], ast.expr.application(ast.expr.abstraction([ast.param("x",ast.type.native("string"))], ast.expr.ident("x")) ,
                                                             ast.expr.number(1))
                                   ).failure(), 
                   "type can not be infered");
    test.done();                
  },
    
  'checking invalid binding in application': function(test) {
    test.expect(1);
    // tests here  
    var aTypeSystem = typesystem(entities());  
      
    test.ok(aTypeSystem.expression([pair("y",ast.type.native("int"))],
                                    ast.expr.application(ast.expr.abstraction([ast.param("x",ast.type.native("string"))], ast.expr.ident("x")) ,
                                                         ast.expr.ident("y"))
                                   ).failure(), 
                   "type can not be infered");
    test.done();                
  },
    
  'checking valid binding in application': function(test) {
    test.expect(1);
    // tests here  
    var aTypeSystem = typesystem(entities());  
      
    test.deepEqual(aTypeSystem.expression([pair("y",ast.type.native("string"))], 
                                            ast.expr.application(ast.expr.abstraction([ast.param("x",ast.type.native("string"))], ast.expr.ident("x")) ,
                                                                 ast.expr.ident("y"))
                                          ).success()._2, 
                    ast.type.native("string"),
                   "type can be infered");
    test.done();                
  },
};
