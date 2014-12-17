'use strict';

var types = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/types.js').types,
    ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/ast.js').ast,
    list = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/list.js').list;     

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

exports['types_freevar'] = {
  setUp: function(done) {
    done();
  },

  "Native is not a freevar": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.freeVariables(ast.type.native("a")), list(), "Empty free variables");
      test.done();
  },

  "Variable is a freevar": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.freeVariables(ast.type.variable("a")), list("a"), "Not empty free variables");
      test.done();
  },

  "Array of Variable has a freevar": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.freeVariables(ast.type.array(ast.type.variable("a"))), list("a"), "Not empty free variables");
      test.done();
  },
    
  "Array of Native has no freevar": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.freeVariables(ast.type.array(ast.type.native("a"))), list(), "Empty free variables");
      test.done();
  },

  "Function of Variable has a freevar": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.freeVariables(ast.type.abstraction(ast.type.variable("a"),ast.type.variable("b"))), list("a","b"), "Not empty free variables");
      test.done();
  },

  "Pair of Variable has a freevar": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.freeVariables(ast.type.pair(ast.type.variable("a"),ast.type.variable("b"))), list("a","b"), "Not empty free variables");
      test.done();
  },

  "Polymorphic type without freevae": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.freeVariables(ast.type.forall("a",ast.type.variable("a"))), list(), "Empty free variables");
      test.done();
  },
    
  "Polymorphic type with freevae": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.freeVariables(ast.type.forall("a",ast.type.abstraction(ast.type.variable("a"),ast.type.variable("b")))), list("b"), "Not empty free variables");
      test.done();
  },    
};
 