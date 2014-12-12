'use strict';

var typechecker = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/typechecker.js').typechecker,
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

exports['typechecker'] = {
  setUp: function(done) {
    done();
  },
    
  "Pruning native": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.deepEqual(aTypeChecker.prune([], ast.type.native('int')),
                     ast.type.native('int'), 
                     "Pruning native return native");
      test.done();
  },
    
  "Pruning array of native": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.deepEqual(aTypeChecker.prune([], ast.type.array(ast.type.native('int'))), 
                     ast.type.array(ast.type.native('int')), 
                     "Pruning arrayr of native return array of native");
      test.done();
  },    
    
  "Pruning pair of native": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.deepEqual(aTypeChecker.prune([], ast.type.pair(ast.type.native('int'),ast.type.native('string'))), 
                     ast.type.pair(ast.type.native('int'),ast.type.native('string')),
                     "Pruning pair of native return pair of native");
      test.done();
  },    
    
  "Pruning function of native": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.deepEqual(aTypeChecker.prune([], ast.type.abstraction(ast.type.native('int'),ast.type.native('string'))), 
                     ast.type.abstraction(ast.type.native('int'),ast.type.native('string')),
                     "Pruning function of native return function of native");
      test.done();
  },    
    
  "Pruning free variable": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.deepEqual(aTypeChecker.prune([],ast.type.variable("a")), 
                     ast.type.variable("a"),
                     "Pruning free variable return free variable");
      test.done();
  },    
    
  "Pruning bound variable": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.deepEqual(aTypeChecker.prune([pair("a",ast.type.native('int'))], ast.type.variable("a")), 
                     ast.type.native("int"),
                     "Pruning bound variable return reference");
      test.done();
  },    
};
