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
      
    test.deepEqual(aTypeChecker.expression({}, ast.expr.number(1)).get(), ast.type.ident('int'), "type must be an int");
    test.done();                
  },
    
  '"1" must be a string': function(test) {
    test.expect(1);
    // tests here  
    var aTypeChecker = typechecker(entities());  
      
    test.deepEqual(aTypeChecker.expression({}, ast.expr.string("1")).get(), ast.type.ident('string'), "type must be a string");
    test.done();                
  },
    
  'ident in environment': function(test) {
    test.expect(1);
    // tests here  
    var aTypeChecker = typechecker(entities());  
      
    test.deepEqual(aTypeChecker.expression({a:ast.type.ident('A')}, ast.expr.ident("a")).get(), ast.type.ident('A'), "type must be defined");
    test.done();                
  },
    
  'ident not in environment': function(test) {
    test.expect(1);
    // tests here  
    var aTypeChecker = typechecker(entities());  
      
    test.equal(aTypeChecker.expression({}, ast.expr.ident("a")).isPresent(), false, "type must not be defined");
    test.done();                
  },
    
  'ident in entities': function(test) {
    test.expect(1);
    // tests here  
    var aTypeChecker = typechecker(entities().declare(ast.model('a',[])));  
      
    test.deepEqual(aTypeChecker.expression({}, ast.expr.ident("a")).get(), ast.model('a',[]), "type must be defined");
    test.done();                
  },
};