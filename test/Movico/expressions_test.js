'use strict';

var expression = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/expressions.js').expressions,
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

exports['entities'] = {
  setUp: function(done) {
    done();
  },

  "Number is not a free variables": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.number(1);
      test.deepEqual(expression.freeVariables(list(), anExpression), list(), "Must be empty");
      test.done();
  },

  "String is not a free variables": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.string("1");
      test.deepEqual(expression.freeVariables(list(), anExpression), list(), "Must be empty");
      test.done();
  },

  "Unit is not a free variables": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.unit();
      test.deepEqual(expression.freeVariables(list(), anExpression), list(), "Must be empty");
      test.done();
  },

  "free Ident is a free variables": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.ident("a");
      test.deepEqual(expression.freeVariables(list(), anExpression), list("a"), "Must not be empty");
      test.done();
  },
    
  "bound Ident is not a free variables": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.ident("a");
      test.deepEqual(expression.freeVariables(list("a"), anExpression), list(), "Must not be empty");
      test.done();
  },

  "Pair with two free variables": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.pair(ast.expr.ident("a"), ast.expr.ident("b"));
      test.deepEqual(expression.freeVariables(list(), anExpression), list("a", "b"), "Must not be empty");
      test.done();
  },

  "Pair with one free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.pair(ast.expr.ident("a"), ast.expr.ident("a"));
      test.deepEqual(expression.freeVariables(list(), anExpression), list("a"), "Must not be empty");
      test.done();
  },

  "Pair with one free variable and one bound variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.pair(ast.expr.ident("a"), ast.expr.ident("b"));
      test.deepEqual(expression.freeVariables(list("b"), anExpression), list("a"), "Must not beempty");
      test.done();
  },

  "Pair with one bound variable and one free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.pair(ast.expr.ident("a"), ast.expr.ident("b"));
      test.deepEqual(expression.freeVariables(list("a"), anExpression), list("b"), "Must not be empty");
      test.done();
  },

  "Pair without free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.pair(ast.expr.ident("a"), ast.expr.ident("b"));
      test.deepEqual(expression.freeVariables(list("a","b"), anExpression), list(), "Must be empty");
      test.done();
  },

  "Instance with one free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.pair(ast.expr.instance("a",[ ast.expr.ident("b") ]));
      test.deepEqual(expression.freeVariables(list(), anExpression), list("b"), "Must not be empty");
      test.done();
  },

  "Instance without free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.pair(ast.expr.instance("a",[ ast.expr.ident("b") ]));
      test.deepEqual(expression.freeVariables(list("b"), anExpression), list(), "Must be empty");
      test.done();
  },

  "Application with two free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b"));
      test.deepEqual(expression.freeVariables(list(), anExpression), list("a", "b"), "Must not be empty");
      test.done();
  },

  "Application with one left free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b"));
      test.deepEqual(expression.freeVariables(list("b"), anExpression), list("a"), "Must not be empty");
      test.done();
  },

  "Application with one right free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b"));
      test.deepEqual(expression.freeVariables(list("a"), anExpression), list("b"), "Must not be empty");
      test.done();
  },

  "Application with no free variables": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b"));
      test.deepEqual(expression.freeVariables(list("a","b"), anExpression), list(), "Must be empty");
      test.done();
  },

  "Comprehension with no free variables": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.comprehension(ast.expr.ident("a"),[["a", ast.expr.unit()]],[]);
      test.deepEqual(expression.freeVariables(list(), anExpression), list(), "Must be empty");
      test.done();
  },

  "Comprehension with a free variable in iteration": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.comprehension(ast.expr.ident("a"),[["a", ast.expr.ident('b')]],[]);
      test.deepEqual(expression.freeVariables(list(), anExpression), list("b"), "Must not be empty");
      test.done();
  },

  "Comprehension with a free variable in condition": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.comprehension(ast.expr.ident("a"),[["a", ast.expr.unit()]],[ast.expr.ident("b")]);
      test.deepEqual(expression.freeVariables(list(), anExpression), list("b"), "Must not be empty");
      test.done();
  },

  "Comprehension with a free variable in the value": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.comprehension(ast.expr.ident("b"),[["a", ast.expr.unit()]],[]);
      test.deepEqual(expression.freeVariables(list(), anExpression), list("b"), "Must not be empty");
      test.done();
  },

  "Tag with free variables in attributes": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.tag("a",[["id",ast.expr.ident("b")]],[]);
      test.deepEqual(expression.freeVariables(list(), anExpression), list("b"), "Must not be empty");
      test.done();
  },
    
  "Tag with free variables in body": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.tag("a",[],[ast.expr.ident("b")]);
      test.deepEqual(expression.freeVariables(list(), anExpression), list("b"), "Must not be empty");
      test.done();
  },
    
  "Let with free variables in body": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.let("a", ast.expr.unit(), ast.expr.ident("b"));
      test.deepEqual(expression.freeVariables(list(), anExpression), list("b"), "Must not be empty");
      test.done();
  },
    
  "Let with free variables in binding": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.let("a", ast.expr.ident("b"), ast.expr.unit());
      test.deepEqual(expression.freeVariables(list(), anExpression), list("b"), "Must not be empty");
      test.done();
  },
    
  "Let with bound variable in the body": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.let("a", ast.expr.string("b"), ast.expr.ident("a"));
      test.deepEqual(expression.freeVariables(list(), anExpression), list(), "Must be empty");
      test.done();
  },
};
