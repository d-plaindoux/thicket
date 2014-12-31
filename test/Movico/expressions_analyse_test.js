'use strict';

var expression = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/expressions.js').expressions,
    ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/ast.js').ast,
    pair = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/pair.js').pair,
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

  "Analyse Unit": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.unit();
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(), 
                     pair(list(),ast.type.native('unit')), 
                     "Must be unit");
      test.done();
  },
    
  "Analyse Number": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.number(1);
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(), 
                     pair(list(),ast.type.native('number')), 
                     "Must be number");
      test.done();
  },
    
  "Analyse String": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.string("1");
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(), 
                     pair(list(),ast.type.native('string')), 
                     "Must be string");
      test.done();
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
      test.deepEqual(expression.analyse(list(), list(pair("a", ast.type.native("string"))), anExpression).success(),
                     pair(list(), ast.type.native("string")),
                     "Must be string");
      test.done();
  },

  "Analyse Native pair": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.pair(ast.expr.number('1'), ast.expr.string('a'));
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(), 
                     pair(list(),ast.type.pair(ast.type.native('number'), ast.type.native('string'))), 
                     "Must be (int,string)");
      test.done();
  },

  "Analyse Generalisable type success": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.ident("b");
      test.deepEqual(expression.analyse(list("a"), list(pair("b",ast.type.variable("a"))), anExpression).success(), 
                     pair(list(),ast.type.variable("a")),
                     "Must be generalizable");
      test.done();
  },

  "Analyse Generalisable type failure": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.ident("b");
      test.ok(expression.analyse(list(), list(pair("b",ast.type.variable("a"))), anExpression).isFailure(), 
              "Must be not generalizable");
      test.done();
  },

  "Analyse Generalisable polymorphic type": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.forall("a", ast.expr.ident("b"));
      test.deepEqual(expression.analyse(list(), list(pair("b",ast.type.variable("a"))), anExpression).success(), 
                     pair(list(),ast.type.forall("a", ast.type.variable("a"))),
                     "Must be generalizable");
      test.done();
  },

  "Analyse Simple abstraction": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.abstraction(ast.param("a",ast.type.native("int")), ast.expr.ident("a"));
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(), 
                     pair(list(),ast.type.abstraction(ast.type.native("int"),ast.type.native("int"))),
                     "Must be (int -> string)");
      test.done();
  },
    
  "Analyse identity abstraction": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.abstraction(ast.param("a",ast.type.variable("b")), ast.expr.ident("a"));
      test.deepEqual(expression.analyse(list("b"), list(), anExpression).success(), 
                     pair(list(),ast.type.abstraction(ast.type.variable("b"),ast.type.variable("b"))),
                     "Must be (int -> string)");
      test.done();
  },
    
  "Analyse generalized identity abstraction": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.forall("b",ast.expr.abstraction(ast.param("a",ast.type.variable("b")), ast.expr.ident("a")));
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(), 
                     pair(list(),ast.type.forall("b", ast.type.abstraction(ast.type.variable("b"),ast.type.variable("b")))),
                     "Must be (int -> string)");
      test.done();
  },
    
  "Analyse let string expression": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.let("a",ast.expr.string("b"),ast.expr.ident("a"));
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(), 
                     pair(list(), ast.type.native("string")),
                     "Must be (string)");
      test.done();
  },
    
  "Analyse let variable expression": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.let("a",ast.expr.ident("b"),ast.expr.ident("a"));
      test.deepEqual(expression.analyse(list("c"), list(pair("b",ast.type.variable("c"))), anExpression).success(), 
                     pair(list(), ast.type.variable("c")),
                     "Must be (c)");
      test.done();
  },
    
  "Analyse let generalizable variable expression": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.let("a",ast.expr.forall("c",ast.expr.ident("b")),ast.expr.ident("a"));
      test.deepEqual(expression.analyse(list(), list(pair("b",ast.type.variable("c"))), anExpression).success(), 
                     pair(list(), ast.type.forall("c",ast.type.variable("c"))),
                     "Must be (c)");
      test.done();
  },
    
  "Analyse application variable expression": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.application(ast.expr.abstraction(ast.param("a",ast.type.native("number")),ast.expr.ident("a")),
                                              ast.expr.number(12));
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(), 
                     pair(list(), ast.type.native("number")),
                     "Must be (number)");
      test.done();
  },
    
  "Analyse instance with undefined model": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.instance("A",[]);
      test.ok(expression.analyse(list(), list(), anExpression).isFailure(), 
              "Model not found");
      test.done();
  },
    
  "Analyse instance with not a model": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.instance("A",[]);
      test.ok(expression.analyse(list(), list(pair("A",ast.type.native('int'))), anExpression).isFailure(), 
              "Model not found");
      test.done();
  },
    
  "Analyse instance with less arguments than required by the model": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.instance("A",[]);
      test.ok(expression.analyse(list(), list(pair("A",ast.model("A",[ast.param("x",ast.type.native("number"))]))), anExpression).isFailure(),
              "Model not found");
      test.done();
  },
    
  "Analyse instance with more arguments than required by the model": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.instance("A",[ast.expr.number(1)]);
      test.ok(expression.analyse(list(), list(pair("A",ast.model("A",[]))), anExpression).isFailure(), 
              "Model not found");
      test.done();
  },
    
  "Analyse instance with a model": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.instance("A",[]);
      test.deepEqual(expression.analyse(list(), list(pair("A",ast.model("A",[]))), anExpression).success(), 
                     pair(list(), ast.model("A",[],[])),
                     "Model found");
      test.done();
  },
        
  "Analyse instance with one argument required by the model": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.instance("A",[ast.expr.number(1)]),
          aModel = ast.model("A",[ast.param("x",ast.type.native("number"))]);
      test.deepEqual(expression.analyse(list(), list(pair("A",aModel)), anExpression).success(),
                     pair(list(), aModel),
                     "Model found");
      test.done();
  },
        
  "Analyse instance with two arguments required by the model": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.instance("A",[ast.expr.number(1),ast.expr.string("1")]),
          aModel = ast.model("A",[ast.param("x",ast.type.native("number")),ast.param("x",ast.type.native("string"))]);
      test.deepEqual(expression.analyse(list(), list(pair("A",aModel)), anExpression).success(),
                     pair(list(), aModel),
                     "Model found");
      test.done();
  },
        
  "Analyse instance with one wrong argument required by the model": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.instance("A",[ast.expr.number(1)]),
          aModel = ast.model("A",[ast.param("x",ast.type.native("string"))]);
      test.ok(expression.analyse(list(), list(pair("A",aModel)), anExpression).isFailure(), 
              "Model found with incompatible argument");
      test.done();
  },
        
  "Analyse instance with two wrong arguments required by the model": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.instance("A",[ast.expr.string("1"),ast.expr.number(1)]),
          aModel = ast.model("A",[ast.param("x",ast.type.native("number")),ast.param("x",ast.type.native("string"))]);
      test.ok(expression.analyse(list(), list(pair("A",aModel)), anExpression).isFailure(),
             "Model found with incompatible argument");
      test.done();
  },
        
  "Analyse invoke a the model": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.invoke(ast.expr.ident("A"),"x"),
          aModel = ast.model("A",[ast.param("x",ast.type.native("number")),ast.param("x",ast.type.native("string"))]);
      test.deepEqual(expression.analyse(list(), list(pair("A",aModel)), anExpression).success(),
                     pair(list(), ast.type.native('number')),
                     "Model invocation");
      test.done();
  },
        
  "Analyse simple tag": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[],[]);
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(),
                     pair(list(), ast.type.native('XML')),
                     "Simple Tag");
      test.done();
  },
        
  "Analyse simple tag with one attribute": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[["a",ast.expr.string("a")]],[]);
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(),
                     pair(list(), ast.type.native('XML')),
                     "Simple Tag with one attribute");
      test.done();
  },
        
  "Analyse simple tag with one attribute but not a string": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[["a",ast.expr.number(1)]],[]);
      test.ok(expression.analyse(list(), list(), anExpression).failure(),
              "Simple Tag with one attribute but not a string");
      test.done();
  },
        
  "Analyse simple tag with one attribute fails": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[["a",ast.expr.ident("a")]],[]);
      test.ok(expression.analyse(list(), list(), anExpression).isFailure(),
              "Simple Tag with failing attribute");
      test.done();
  },
        
  "Analyse tag with one embedded tag": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[],[ast.expr.tag("B",[],[])]);
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(),
                     pair(list(), ast.type.native('XML')),
                     "Tag containing Tag");
      test.done();
  },
        
  "Analyse tag with one embedded string": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[],[ast.expr.string("a")]);
      test.ok(expression.analyse(list(), list(), anExpression).isFailure(),
              "Tag containing String");
      test.done();
  },
   
  "Analyse tag with one embedded number": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[],[ast.expr.number(1)]);
      test.ok(expression.analyse(list(), list(), anExpression).isFailure(),
              "Tag containing number");
      test.done();
  },
   
  "Analyse tag with one embedded variable": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[],[ast.expr.ident("a")]);
      test.deepEqual(expression.analyse(list(), list(pair("a",ast.type.variable("a"))), anExpression).success(),
                     pair(list(pair('a',ast.type.native("XML"))), ast.type.native('XML')),
                     "Tag containing ident");
      test.done();
  },
   
  "Analyse tag with one attribute variable": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[["a",ast.expr.ident("a")]],[]);
      test.deepEqual(expression.analyse(list(), list(pair("a",ast.type.variable("a"))), anExpression).success(),
                     pair(list(pair('a',ast.type.native("string"))), ast.type.native('XML')),
                     "Tag containing ident");
      test.done();
  },
        
  "Analyse invoke a controller with a specified type": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.invoke(ast.expr.ident("A"),"x"),
          aController = ast.controller("A",ast.param("this",ast.type.native("number")),
                                       [ast.method("x",ast.expr.number(1)).setType(ast.type.native('number'))]);
      test.deepEqual(expression.analyse(list(), list(pair("A",aController)), anExpression).success(),
                     pair(list(), ast.type.native('number')),
                     "Controller invocation");
      test.done();
  },
/* TODO        
  "Analyse invoke a controller with a unspecified type": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.application(ast.expr.invoke(ast.expr.ident("A"),"x"),ast.expr.number(1)),
          aController = ast.controller("A",ast.param("this",ast.type.native("number")),
                                       [ast.method("x",ast.expr.abstraction(ast.param("x",ast.type.native("number")),ast.expr.ident("x")))]);
      test.deepEqual(expression.analyse(list(), list(pair("A",aController)), anExpression).success(),
                     pair(list(), ast.type.native('number')),
                     "Controller invocation");
      test.done();
  },
*/
};
