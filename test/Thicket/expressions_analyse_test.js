'use strict';

var expression = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/checker/expressions.js'),
    types = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/checker/types.js'),
    ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/ast.js'),
    pair = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/pair.js'),
    list = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/list.js');

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

  "Analyse Unit": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.unit();
      types.reset();
      test.deepEqual(expression.analyse(list(), list(), list(), anExpression).success(), 
                     pair(list(pair("'a",ast.type.native("unit"))),ast.type.native('unit')), 
                     "Must be unit");
      test.done();
  },

  "Analyse Number": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.number(1);
      types.reset();
      test.deepEqual(expression.analyse(list(), list(), list(), anExpression).success(), 
                     pair(list(pair("'a",ast.type.native("number"))),ast.type.native('number')), 
                     "Must be number");
      test.done();
  },
    
  "Analyse String": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.string("1");
      types.reset();      
      test.deepEqual(expression.analyse(list(), list(), list(), anExpression).success(), 
                     pair(list(pair("'a",ast.type.native("string"))),ast.type.native('string')), 
                     "Must be string");
      test.done();
  },
    
  "Analyse free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.ident("a");
      test.ok(expression.analyse(list(), list(), list(), anExpression).isFailure(),
              "Must be unbound");
      test.done();
  },
    
  "Analyse bound variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.ident("a");
      types.reset();
      test.deepEqual(expression.analyse(list(), list(pair("a", ast.type.native("string"))), list(), anExpression).success(),
                     pair(list(pair("'a",ast.type.native("string"))), ast.type.native("string")),
                     "Must be string");
      test.done();
  },

  "Analyse generic type": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.ident("b");
      types.reset();
      test.deepEqual(expression.analyse(list(), list(pair("b",ast.type.variable("a"))), list(), anExpression).success(), 
                     pair(list(pair('a',ast.type.variable("'a"))), ast.type.variable("'a")),
                     "Must be not generalizable");
      test.done();
  },
    
  "Analyse Simple Generalizable": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.abstraction("a", ast.expr.ident("a"));
      types.reset();
      test.deepEqual(expression.analyse(list(), list(), list(), anExpression, types.newVar()).success(), 
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
      test.deepEqual(expression.analyse(list(), list(), list(), anExpression, ast.type.abstraction(types.newVar(),types.newVar())).success(), 
                     pair(list(pair("'d", ast.type.variable("'b")),
                               pair("'e", ast.type.variable("'b")),
                               pair("'a", ast.type.variable("'b"))), 
                          ast.type.abstraction(ast.type.variable("'b"),ast.type.variable("'b"))),
                     "Must be (a -> a)");
      test.done();
  },    

  "Analyse let string expression": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.let("a", ast.expr.string("b"), ast.expr.ident("a"));
      types.reset();
      test.deepEqual(expression.analyse(list(), list(), list(), anExpression).success(), 
                     pair(list(pair("'c", ast.type.native("string")),
                               pair("'d", ast.type.native("string")),
                               pair("'b", ast.type.native("string")),
                               pair("'a", ast.type.native("string"))), ast.type.native("string")),
                     "Must be (string)");
      test.done();
  },
    
  "Analyse let variable expression": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.let("a",ast.expr.ident("b"),ast.expr.ident("a"));
      types.reset();      
      test.deepEqual(expression.analyse(list("c"), list(pair("b",ast.type.native("c"))), list(), anExpression).success(), 
                     pair(list(pair("'c", ast.type.native("c")),
                               pair("'d", ast.type.native("c")),
                               pair("'b", ast.type.native("c")),
                               pair("'a", ast.type.native("c"))), ast.type.native("c")),
                     "Must be (c)");
      test.done();
  },
    
  "Analyse application variable expression": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.application(ast.expr.abstraction("a",ast.expr.ident("a")), ast.expr.number(12));
      types.reset();
      test.deepEqual(expression.analyse(list(), list(), list(), anExpression).success(), 
                     pair(list(pair("'c", ast.type.native("number")),
                               pair("'d", ast.type.native("number")),
                               pair("'b", ast.type.native("number")),
                               pair("'a", ast.type.native("number"))), ast.type.native("number")),
                     "Must be (number)");
      test.done();
  },
    
  "Analyse simple tag": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[],[]);
      types.reset();      
      test.deepEqual(expression.analyse(list(), list(), list(), anExpression).success(),
                     pair(list(pair("'a", ast.type.native("dom"))), ast.type.native("dom")),
                     "Simple Tag");
      test.done();
  },
        
  "Analyse simple tag with one attribute": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[["a",ast.expr.string("a")]],[]);
      types.reset();
      test.deepEqual(expression.analyse(list(), list(), list(), anExpression).success(),
                     pair(list(pair("'a", ast.type.native("dom"))), ast.type.native("dom")),
                     "Simple Tag with one attribute");
      test.done();
  },
    
  "Analyse simple tag with one attribute but not a string": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[["a",ast.expr.number(1)]],[]);
      types.reset();
      test.ok(expression.analyse(list(), list(), list(), anExpression).isFailure(),
              "Simple Tag with one attribute but not a string");
      test.done();
  },
        
  "Analyse simple tag with one attribute fails": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[["a",ast.expr.ident("a")]],[]);
      types.reset();
      test.ok(expression.analyse(list(), list(), list(), anExpression).isFailure(),
              "Simple Tag with failing attribute");
      test.done();
  },
        
  "Analyse tag with one embedded tag": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[],[ast.expr.tag("B",[],[])]);
      types.reset();
      test.deepEqual(expression.analyse(list(), list(), list(), anExpression).success(),
                     pair(list(pair("'a", ast.type.native("dom"))), ast.type.native("dom")),
                     "Tag containing Tag");
      test.done();
  },
        
  "Analyse tag with one embedded string": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[],[ast.expr.string("a")]);
      types.reset();
      test.ok(expression.analyse(list(), list(), list(), anExpression).isFailure(),
              "Tag containing String");
      test.done();
  },
   
  "Analyse tag with one embedded number": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[],[ast.expr.number(1)]);
      types.reset();
      test.ok(expression.analyse(list(), list(), list(), anExpression).isFailure(),
              "Tag containing number");
      test.done();
  },
   
  "Analyse tag with one embedded variable": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[],[ast.expr.ident("a")]);
      types.reset();
      test.deepEqual(expression.analyse(list(), list(pair("a",ast.type.variable("a"))), list(), anExpression).success(),
                     pair(list(pair("'a",ast.type.native("dom"))), ast.type.native("dom")),
                     "Tag containing ident");
      test.done();
  },
    
  "Analyse tag with one attribute variable": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[["a",ast.expr.ident("a")]],[]);
      types.reset();      
      test.deepEqual(expression.analyse(list(), list(pair("a",ast.type.variable("a"))), list(), anExpression).success(),
                     pair(list(pair("'a",ast.type.native("dom"))), ast.type.native("dom")),
                     "Tag containing ident");
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
      test.deepEqual(expression.analyse(list(), list(pair("A",aController)), list(), anExpression).success(),
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
      test.deepEqual(expression.analyse(list(), list(pair("A",aModel)), list(), anExpression).success(),
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
      test.ok(expression.analyse(list(), list(), list(pair("A",aModel)), anExpression).isFailure(),              
              "Model invocation");
      test.done();
  },
};
