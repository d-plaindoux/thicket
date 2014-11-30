'use strict';

var expression = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/expression.js').expression,
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

exports['entities'] = {
  setUp: function(done) {
    done();
  },

  "Number is not a free variables": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.number(1);
      test.deepEqual(expression.freeVariables([], anExpression), [], "Must be empty");
      test.done();
  },

  "String is not a free variables": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.string("1");
      test.deepEqual(expression.freeVariables([], anExpression), [], "Must be empty");
      test.done();
  },

  "free Ident is a free variables": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.ident("a");
      test.deepEqual(expression.freeVariables([], anExpression), ["a"], "Must not be empty");
      test.done();
  },
    
  "bound Ident is not a free variables": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.ident("a");
      test.deepEqual(expression.freeVariables(["a"], anExpression), [], "Must not be empty");
      test.done();
  },

  "Pair with two free variables": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.pair(ast.expr.ident("a"), ast.expr.ident("b"));
      test.deepEqual(expression.freeVariables([], anExpression), ["a", "b"], "Must not be empty");
      test.done();
  },

  "Pair with one free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.pair(ast.expr.ident("a"), ast.expr.ident("a"));
      test.deepEqual(expression.freeVariables([], anExpression), ["a"], "Must not be empty");
      test.done();
  },

  "Pair with one free variable and one bound variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.pair(ast.expr.ident("a"), ast.expr.ident("b"));
      test.deepEqual(expression.freeVariables(["b"], anExpression), ["a"], "Must not beempty");
      test.done();
  },

  "Pair with one bound variable and one free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.pair(ast.expr.ident("a"), ast.expr.ident("b"));
      test.deepEqual(expression.freeVariables(["a"], anExpression), ["b"], "Must not be empty");
      test.done();
  },

  "Instance with one free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.pair(ast.expr.instance("a",[ ast.expr.ident("b") ]));
      test.deepEqual(expression.freeVariables([], anExpression), ["b"], "Must not be empty");
      test.done();
  },

  "Instance without free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.pair(ast.expr.instance("a",[ ast.expr.ident("b") ]));
      test.deepEqual(expression.freeVariables(["b"], anExpression), [], "Must be empty");
      test.done();
  },
};
