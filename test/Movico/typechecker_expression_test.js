'use strict';

var typechecker = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/typechecker.js').typechecker,
    entities = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/entities.js').entities,
    ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/ast.js').ast;
    

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

exports['typechecker'] = {
  setUp: function(done) {
    done();
  },
    
  '1 must be an int': function(test) {
    test.expect(1);
    // tests here  
    var aTypeChecker = typechecker(entities());  
      
    test.deepEqual(aTypeChecker.expression([], ast.expr.number(1)).success(), 
                   ast.type.native('int'), 
                   "type must be an int");
    test.done();                
  },
    
  '"1" must be a string': function(test) {
    test.expect(1);
    // tests here  
    var aTypeChecker = typechecker(entities());  
      
    test.deepEqual(aTypeChecker.expression([], ast.expr.string("1")).success(), 
                   ast.type.native('string'), 
                   "type must be a string");
    test.done();                
  },
    
  'ident in environment': function(test) {
    test.expect(1);
    // tests here  
    var aTypeChecker = typechecker(entities());  
      
    test.deepEqual(aTypeChecker.expression([ast.param("a",ast.type.ident('A'))], ast.expr.ident("a")).success(), 
                   ast.type.ident('A'), 
                   "type must be defined");
    test.done();                
  },
    
  'ident not in environment': function(test) {
    test.expect(1);
    // tests here  
    var aTypeChecker = typechecker(entities());  
      
    test.ok(aTypeChecker.expression([], ast.expr.ident("a")).isFailure(), 
            "type must not be defined");
    test.done();                
  },
    
  'ident in entities': function(test) {
    test.expect(1);
    // tests here  
    var aTypeChecker = typechecker(entities().declare(ast.model('a',[])));  
      
    test.deepEqual(aTypeChecker.expression([], ast.expr.ident("a")).success(), 
                   ast.model('a',[]), 
                   "type must be defined");
    test.done();                
  },
    
  'checking empty model': function(test) {
    test.expect(1);
    // tests here  
    var aTypeChecker = typechecker(entities().declare(ast.model('a',[],[])));  
      
    test.deepEqual(aTypeChecker.expression([], ast.expr.instance("a",[])).success(), 
                   ast.model('a',[], []), 
                   "type must be defined");
    test.done();                
  },
    
  'checking model with no arguments and parameters': function(test) {
    test.expect(1);
    // tests here  
    var aTypeChecker = typechecker(entities().declare(ast.model('a',[],[["a",ast.type.ident('int')]])));  
      
    test.ok(aTypeChecker.expression([], ast.expr.instance("a",[])).isFailure(), 
            "type cannot be infered");
    test.done();                
  },
    
  'checking model with arguments and no parameters': function(test) {
    test.expect(1);
    // tests here  
    var aTypeChecker = typechecker(entities().declare(ast.model('a',[],[])));  
      
    test.ok(aTypeChecker.expression([], ast.expr.instance("a",[ast.expr.number(1)])).isFailure(), 
            "type cannot be infered");
    test.done();                
  },
    
  'checking model with arguments and parameters': function(test) {
    test.expect(1);
    // tests here  
    var aTypeChecker = typechecker(entities().declare(ast.model('a',[], [["a",ast.type.native('int')]])));  
      
    test.deepEqual(aTypeChecker.expression([], ast.expr.instance("a",[ast.expr.number(1)])).success(), 
                   ast.model('a',[],[["a",ast.type.native('int')]]),
                   "type can be infered");
    test.done();                
  },
    
  'checking pair': function(test) {
    test.expect(1);
    // tests here  
    var aTypeChecker = typechecker(entities());  
      
    test.deepEqual(aTypeChecker.expression([], ast.expr.pair(ast.expr.number(1), ast.expr.string("a"))).success(), 
                   ast.type.pair(ast.type.native("int"),ast.type.native("string")),
                   "type can be infered");
    test.done();                
  },
    
  'checking function': function(test) {
    test.expect(1);
    // tests here  
    var aTypeChecker = typechecker(entities());  
      
    test.deepEqual(aTypeChecker.expression([], ast.expr.abstraction([ast.param("x",ast.type.native("int"))], ast.expr.ident("x"))).success(), 
                   ast.type.abstraction(ast.type.native("int"),ast.type.native("int")),
                   "type can be infered");
    test.done();                
  },
};
