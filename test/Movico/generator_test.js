'use strict';

var ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/syntax/ast.js'),
    list = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/list.js'),
    compiler = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/generator/code2.js');

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
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['compile'] = {
  setUp: function(done) {
      done();
  },

  'Simple model': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.entity(list(),ast.model("A",[],[])).success(),
                    compiler.objCode("Model","A",[]));
      test.done();
  },

  'Model with one attribute': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.entity([], ast.model("A",[],[ast.param("a",ast.type.native("a"))])).success(),
                     compiler.objCode("Model","A",["a"]));
      test.done();
  },

  'Model with two attributes': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.entity(list(), ast.model("A",list(),[ast.param("a1",ast.type.native("a")),
                                                                   ast.param("a2",ast.type.native("b"))])).success(), 
                    compiler.objCode("Model","A",["a1", "a2"]));
      test.done();
  },

  'Simple controller': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.entity(list(), ast.controller("A",[],ast.param("this",ast.type.native("a")),[],[])).success(),
                     compiler.objCode("Controller","A","this",[]));
      test.done();
  },

  'Controller with unbox': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.entity(list(), 
                                     ast.controller("A",[],
                                                    ast.param("this",ast.type.native("a")),
                                                    [],
                                                    [ast.method("unbox", ast.expr.ident("this"))])).success(),
                    compiler.objCode("Controller","A","this",[["unbox",compiler.objCode("Variable","this")]]));
      test.done();
  },

    'Controller with filtered unbox': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.entity(list(ast.model('number',[],[])),
                                     ast.controller("A",[],
                                                    ast.param("this",ast.type.native("a")),
                                                    [],
                                                    [ast.method("unbox", ast.expr.ident("this"), ast.type.variable('number'))])).success(),
                    compiler.objCode("Controller","A","this",[["number.unbox",compiler.objCode("Variable","this")]]));
      test.done();
  },
    
  'Simple view': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.entity(list(), ast.view("A",[],ast.param("this",ast.type.native("a")),[ast.expr.number(1)])).success(),
                     compiler.objCode("View","A","this",[compiler.objCode("Number",1)]));
      test.done();
  },    
     
  'Simple Definition': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.entity(list(), ast.expression("A",ast.type.native("number"),ast.expr.number(1))).success(),
                     compiler.objCode("Definition","A",compiler.objCode("Number",1)));
      test.done();
  },
    
  'Number': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list(), ast.expr.number(1)).success(),
                     compiler.objCode("Number",1));
      test.done();
  },
    
  'String': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list(), ast.expr.string("1")).success(),
                     compiler.objCode("String",1));
      test.done();
  },

  'Unit': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list(), ast.expr.unit()).success(),
                     compiler.objCode("Unit"));
      test.done();
  },

  'Pair': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(ast.model("Pair",[],[])), list(), ast.expr.pair(ast.expr.number(1),ast.expr.string("1"))).success(),
                     compiler.objCode("Apply",
                                      compiler.objCode("Apply", 
                                                       compiler.objCode("Ident", "Pair"),
                                                       compiler.objCode("Number", 1)),
                                      compiler.objCode("String", "1")));
      test.done();
  },
  
  'Local ident': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('a'), ast.expr.ident("a")).success(),
                     compiler.objCode("Variable","a"));
      test.done();
  },

  'Global ident': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list(), ast.expr.ident("a")).success(),
                     compiler.objCode("Ident","a"));
      test.done();
  },

  'Lambda expression': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list(), ast.expr.abstraction("a", ast.expr.ident("a"))).success(),
                     compiler.objCode("Function", "a", compiler.objCode("Variable","a")));
      test.done();
  },

  'Apply expression': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('a', 'b'), ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b"))).success(),
                     compiler.objCode("Apply", 
                                      compiler.objCode("Variable","a"),
                                      compiler.objCode("Variable","b")));
      test.done();
  },

    'Invoke expression': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('a', 'b'), ast.expr.invoke(ast.expr.ident("a"), "b")).success(),
                     compiler.objCode("Invoke",compiler.objCode("Variable","a"),"b"));
      test.done();
  },

  'Apply/Invoke expression': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('a'), ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b"))).success(),
                     compiler.objCode("Invoke",compiler.objCode("Variable","a"),"b"));
      test.done();
  },

  'Let expression': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('a'), ast.expr.let("b",ast.expr.ident("a"),ast.expr.ident("b"))).success(),
                     compiler.objCode("Apply", 
                                      compiler.objCode("Function","b",compiler.objCode("Variable","b")),
                                      compiler.objCode("Eval", compiler.objCode("Variable","a"))));
      test.done();
  },
 
  'Comprehension expression': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('l'), ast.expr.comprehension(ast.expr.ident('x'),[['x',ast.expr.ident('l')]],[])).success(),
                     compiler.objCode("Apply", 
                                      compiler.objCode("Invoke", compiler.objCode("Variable","l"), "map"),
                                      compiler.objCode("Function","x",compiler.objCode("Variable","x"))));
      test.done();
  },
    
  'Comprehension expression with two map': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('l'), ast.expr.comprehension(ast.expr.ident('x'),[['x',ast.expr.ident('l')],['y',ast.expr.ident('m')]],[])).success(),
                     compiler.objCode("Apply", 
                                      compiler.objCode("Invoke", compiler.objCode("Ident","m"), "flatmap"),
                                      compiler.objCode("Function", "y",
                                                       compiler.objCode("Apply", 
                                                                        compiler.objCode("Invoke", compiler.objCode("Variable","l"), "map"),
                                                                        compiler.objCode("Function","x",compiler.objCode("Variable","x"))))));
      test.done();
  },

  'Comprehension expression with condition': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), 
                                     list('l'), 
                                     ast.expr.comprehension(ast.expr.ident('x'),
                                                            [['x',ast.expr.ident('l')]],
                                                            [ast.expr.ident("b")])).success(),
                    compiler.objCode("Apply", 
                                     compiler.objCode("Invoke", 
                                                      compiler.objCode("Apply", 
                                                                       compiler.objCode("Invoke", compiler.objCode("Variable","l"), "filter"),
                                                                       compiler.objCode("Function","x",compiler.objCode("Ident","b"))),
                                                      "map"
                                                     ),
                                     compiler.objCode("Function","x",compiler.objCode("Variable","x"))
                                    )
                    );
                 // "runtime.apply(runtime.invoke(runtime.apply(runtime.invoke(mvc$l,'filter'),runtime.lazy(function(){return function(mvc$x){return runtime.ident('b');};})),'map'),runtime.lazy(function(){return function(mvc$x){return mvc$x;};}))");
      test.done();
  },
    
  'Simple Empty Tag': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list(), ast.expr.tag("A",[],[])).success(),
                     compiler.objCode("Tag", "A", [], []));
      test.done();
  },

  'Empty Tag with one attribute': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')]],[])).success(),
                     compiler.objCode("Tag", "A", [["a",compiler.objCode("String","b")]], []));
      test.done();
  },
    
  'Empty Tag with two attributes': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')],['b',ast.expr.number(1)]],[])).success(),
                     compiler.objCode("Tag", "A", [["a",compiler.objCode("String","b")],["b",compiler.objCode("Number",1)]], []));                 
      test.done();
  },

  'Tag with a simple content': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('l'), ast.expr.tag("A",[],[ast.expr.tag("B",[],[]),ast.expr.number(1)])).success(),
                     compiler.objCode("Tag", "A", [], [compiler.objCode("Tag", "B", [], []), compiler.objCode("Number",1)]));
      test.done();
  },
  
};
    