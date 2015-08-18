'use strict';

var expression = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/checker/expressions.js'),
    types = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/checker/types.js'),
    ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/ast.js'),
    pair = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/pair.js'),
    list = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/list.js'),
    option = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/option.js'),
    packages = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/packages.js'),
    environment = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/environment.js');    

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

exports['expressions'] = {
  setUp: function(done) {
    done();
  },
    
  "Analyse free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.ident("a");
      test.ok(expression.analyse(list(), list(), anExpression).isFailure(),
              "Must be unbound");
      test.done();
  },
    
  "Analyse bound variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.ident("a");
      types.reset();
      test.deepEqual(expression.analyse(list(pair("a", ast.type.native("string"))), environment(packages(option.none())), anExpression).success(),
                     pair(list(pair("'a",ast.type.native("string"))), ast.type.native("string")),
                     "Must be string");
      test.done();
  },

  "Analyse generic type": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.ident("b");
      types.reset();
      test.deepEqual(expression.analyse(list(pair("b",ast.type.variable("a"))), environment(packages(option.none())), anExpression).success(), 
                     pair(list(pair('a',ast.type.variable("'a"))), ast.type.variable("'a")),
                     "Must be not generalizable");
      test.done();
  },
    
  "Analyse Simple Generalizable": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.abstraction("a", ast.expr.ident("a"));
      types.reset();
      test.deepEqual(expression.analyse(list(), environment(packages(option.none())), anExpression, types.newVar()).success(), 
                     pair(list(pair("'a", ast.type.abstraction(ast.type.variable("'d"),ast.type.variable("'d"))),
                               pair("'c", ast.type.variable("'d"))), 
                          ast.type.abstraction(ast.type.variable("'d"),ast.type.variable("'d"))),
                     "Must be (a -> a)");
      test.done();
  },   
    
  "Analyse Simple Generalizable abstraction": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.abstraction("a", ast.expr.ident("a"));
      types.reset();
      test.deepEqual(expression.analyse(list(), environment(packages(option.none())), anExpression, ast.type.abstraction(types.newVar(),types.newVar())).success(), 
                     pair(list(pair("'d", ast.type.variable("'b")),
                               pair("'e", ast.type.variable("'b")),
                               pair("'a", ast.type.variable("'b"))), 
                          ast.type.abstraction(ast.type.variable("'b"),ast.type.variable("'b"))),
                     "Must be (a -> a)");
      test.done();
  },    
    
  "Analyse let variable expression": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.let("a",ast.expr.ident("b"),ast.expr.ident("a"));
      types.reset();      
      test.deepEqual(expression.analyse(list(pair("b",ast.type.native("c"))), environment(packages(option.none())), anExpression).success(), 
                     pair(list(pair("'b", ast.type.native("c")),
                               pair("'a", ast.type.native("c"))), ast.type.native("c")),
                     "Must be (c)");
      test.done();
  },
    
  "Analyse application variable expression": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.application(ast.expr.abstraction("a",ast.expr.ident("a")), ast.expr.ident("b"));
      types.reset();
      test.deepEqual(expression.analyse(list(pair("b",ast.type.native("number"))), environment(packages(option.none())), anExpression).success(), 
                     pair(list(pair("'c", ast.type.native("number")),
                               pair("'d", ast.type.native("number")),
                               pair("'b", ast.type.native("number")),
                               pair("'a", ast.type.native("number"))), ast.type.native("number")),
                     "Must be (c)");
      test.done();
  },

  "Analyse invoke a controller": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.invoke(ast.expr.ident("A"),"x"),
          aController = ast.controller("A",
                                       [],
                                       ast.param("this",ast.type.native("number")),
                                       [ast.param("x",ast.type.native("number"))],
                                       [ast.method("x",ast.expr.number(1))]);
      types.reset();
      test.deepEqual(expression.analyse(list(pair("A",aController)), environment(packages(option.none())), anExpression).success(),
                     pair(list(pair("'b",aController),pair("'a",ast.type.native("number"))), ast.type.native('number')),
                     "Controller invocation");
      test.done();
  },
       
  "Analyse invoke a model": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.invoke(ast.expr.ident("A"),"x"),
          aModel = ast.model("A",
                             [],
                             [ast.param("x",ast.type.native("number"))]);
      types.reset();
      test.deepEqual(expression.analyse(list(pair("A",aModel)), environment(packages(option.none())), anExpression).success(),
                     pair(list(pair("'b",aModel), pair("'a",ast.type.native("number"))), ast.type.native('number')),
                     "Model invocation");
      test.done();
  },

  "Analyse invoke a model with a wrong accessor": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.invoke(ast.expr.ident("A"),"y"),
          aModel = ast.model("A",
                             [],
                             [ast.param("x",ast.type.native("number"))]);
      types.reset();
      test.ok(expression.analyse(list(pair("A",aModel)), environment(packages(option.none())), anExpression).isFailure(),              
              "Model invocation");
      test.done();
  },
};
