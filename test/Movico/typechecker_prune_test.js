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
    
  "Pruning native": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.deepEqual(aTypeChecker.prune(ast.type.native('int')),
                     ast.type.native('int'), 
                     "Pruning native return native");
      test.done();
  },
    
  "Pruning array of native": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.deepEqual(aTypeChecker.prune(ast.type.array(ast.type.native('int'))), 
                     ast.type.array(ast.type.native('int')), 
                     "Pruning arrayr of native return array of native");
      test.done();
  },    
    
  "Pruning pair of native": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.deepEqual(aTypeChecker.prune(ast.type.pair(ast.type.native('int'),ast.type.native('string'))), 
                     ast.type.pair(ast.type.native('int'),ast.type.native('string')),
                     "Pruning pair of native return pair of native");
      test.done();
  },    
    
  "Pruning function of native": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.deepEqual(aTypeChecker.prune(ast.type.fun(ast.type.native('int'),ast.type.native('string'))), 
                     ast.type.fun(ast.type.native('int'),ast.type.native('string')),
                     "Pruning function of native return function of native");
      test.done();
  },    
    
  "Pruning free ident": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.deepEqual(aTypeChecker.prune(ast.type.ident("a")), 
                     ast.type.ident("a"),
                     "Pruning free ident return free ident");
      test.done();
  },    
    
  "Pruning bound ident": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.deepEqual(aTypeChecker.prune(ast.type.ident("a").bind(ast.type.native('int'))), 
                     ast.type.native("int"),
                     "Pruning bound ident return reference");
      test.done();
  },    
    
  "Pruning bound ident in array": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.deepEqual(aTypeChecker.prune(ast.type.array(ast.type.ident("a").bind(ast.type.native('int')))), 
                     ast.type.array(ast.type.native("int")),
                     "Pruning array of bound ident return array of reference");
      test.done();
  },    
    
  "Pruning bound ident in pair": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.deepEqual(aTypeChecker.prune(ast.type.pair(ast.type.ident("a").bind(ast.type.native('int')),ast.type.ident("b").bind(ast.type.native('string')))), 
                     ast.type.pair(ast.type.native("int"),ast.type.native("string")),
                     "Pruning pair of bound ident return pair of reference");
      test.done();
  },    

  "Pruning bound ident in function": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.deepEqual(aTypeChecker.prune(ast.type.fun(ast.type.ident("a").bind(ast.type.native('int')),ast.type.ident("b").bind(ast.type.native('string')))), 
                     ast.type.fun(ast.type.native("int"),ast.type.native("string")),
                     "Pruning function of bound ident return function of reference");
      test.done();
  },    
};
