'use strict';

var ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/syntax/ast.js'),
    list = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/list.js'),
    compiler = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/generator/code.js');

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

exports['compile'] = {
  setUp: function(done) {
      done();
  },

  'Simple model': function (test) {
      test.expect(1);
      
      test.equal(compiler.entity(list(),ast.model("A",[],[])).success(),
                 "runtime.define('A',runtime.instance({'[id]':'A'}))");
      test.done();
  },

  'Model with one attribute': function (test) {
      test.expect(1);
      
      test.equal(compiler.entity([], ast.model("A",[],[ast.param("a",ast.type.native("a"))])).success(),
                 "runtime.define('A',function(mvc$a){return runtime.instance({'[id]':'A','a':mvc$a});})");
      test.done();
  },

  'Model with two attributes': function (test) {
      test.expect(1);
      
      test.equal(compiler.entity(list(), ast.model("A",list(),[ast.param("a1",ast.type.native("a")),
                                                  ast.param("a2",ast.type.native("b"))])).success(), 
                 "runtime.define('A',function(mvc$a1){return function(mvc$a2){return runtime.instance({'[id]':'A','a1':mvc$a1,'a2':mvc$a2});};})");
      test.done();
  },
    
  'Simple controller': function (test) {
      test.expect(1);
      
      test.equal(compiler.entity(list(), ast.controller("A",[],ast.param("this",ast.type.native("a")),[],[])).success(),
                 "runtime.define('A',function(mvc$this){return runtime.controller(function(mvc$self){return {'[id]':'A','[this]':mvc$this};})})");
      test.done();
  },
    
  'Controller with unbox': function (test) {
      test.expect(1);
      
      test.equal(compiler.entity(list(), 
                                 ast.controller("A",[],
                                    ast.param("this",ast.type.native("a")),
                                    [],
                                    [ast.method("unbox", ast.expr.ident("this"))])).success(),
                 "runtime.define('A',function(mvc$this){return runtime.controller(function(mvc$self){return {'[id]':'A','[this]':mvc$this,'unbox':mvc$this};})})");
      test.done();
  },
  'Controller with filtered unbox': function (test) {
      test.expect(1);
      
      test.equal(compiler.entity(list(ast.model('number',[],[])),
                                 ast.controller("A",[],
                                                ast.param("this",ast.type.native("a")),
                                                [],
                                                [ast.method("unbox", ast.expr.ident("this"), ast.type.variable('number'))])).success(),
                 "runtime.define('A',function(mvc$this){return runtime.controller(function(mvc$self){return {'[id]':'A','[this]':mvc$this,'number.unbox':mvc$this};})})");
      test.done();
  },
    
  'Simple view': function (test) {
      test.expect(1);
      
      test.equal(compiler.entity(list(), ast.view("A",[],ast.param("this",ast.type.native("a")),[ast.expr.number(1)])).success(),
                 "runtime.define('A',function(mvc$this){return runtime.view(function(mvc$self){return {'[id]':'A','[this]':mvc$this,'[render]':[runtime.number(1)]};})})");
      test.done();
  },    
    
  'Simple Definition': function (test) {
      test.expect(1);
      
      test.equal(compiler.entity(list(), ast.expression("A",ast.type.native("number"),ast.expr.number(1))).success(),
                 "runtime.define('A',runtime.lazy(function(){ return runtime.number(1);}))");
      test.done();
  },
    
  'Number': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list(), ast.expr.number(1)).success(),
                 "runtime.number(1)");
      test.done();
  },
    
  'String': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list(), ast.expr.string("1")).success(),
                 "runtime.string('1')");
      test.done();
  },
    
  'Unit': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list(), ast.expr.unit()).success(),
                 "runtime.unit");
      test.done();
  },
    
  'Pair': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(ast.model("PAIR",[],[])), list(), ast.expr.pair(ast.expr.number(1),ast.expr.string("1"))).success(),
                 "runtime.apply(runtime.apply(runtime.ident('Pair'),runtime.lazy(function(){return runtime.number(1);})),runtime.lazy(function(){return runtime.string('1');}))");
      test.done();
  },
    
  'Local ident': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('a'), ast.expr.ident("a")).success(),
                 "mvc$a");
      test.done();
  },
    
  'Global ident': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list(), ast.expr.ident("a")).success(),
                 "runtime.ident('a')");
      test.done();
  },
    
  'Lambda expression': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list(), ast.expr.abstraction("a", ast.expr.ident("a"))).success(),
                 "function(mvc$a){return mvc$a;}");
      test.done();
  },
    
  'Apply expression': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('a', 'b'), ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b"))).success(),
                 "runtime.apply(mvc$a,runtime.lazy(function(){return mvc$b;}))");
      test.done();
  },
    
  'Invoke expression': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('a', 'b'), ast.expr.invoke(ast.expr.ident("a"), "b")).success(),
                 "runtime.invoke(mvc$a,'b')");
      test.done();
  },
    
  'Apply/Invoke expression': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('a'), ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b"))).success(),
                 "runtime.invoke(mvc$a,'b')");
      test.done();
  },
    
  'Let expression': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('a'), ast.expr.let("b",ast.expr.ident("a"),ast.expr.ident("b"))).success(),
                 "runtime.apply(function(mvc$b){return mvc$b;},mvc$a)");
      test.done();
  },
    
  'Comprehension expression': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('l'), ast.expr.comprehension(ast.expr.ident('x'),[['x',ast.expr.ident('l')]],[])).success(),
                 "runtime.apply(runtime.invoke(mvc$l,'map'),runtime.lazy(function(){return function(mvc$x){return mvc$x;};}))");
      test.done();
  },
    
  'Comprehension expression with two map': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('l'), ast.expr.comprehension(ast.expr.ident('x'),[['x',ast.expr.ident('l')],['y',ast.expr.ident('m')]],[])).success(),
                 "runtime.apply(runtime.invoke(runtime.ident('m'),'flatmap'),runtime.lazy(function(){return function(mvc$y){return runtime.apply(runtime.invoke(mvc$l,'map'),runtime.lazy(function(){return function(mvc$x){return mvc$x;};}));};}))");
      test.done();
  },
    
  'Comprehension expression with condition': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), 
                                     list('l'), 
                                     ast.expr.comprehension(ast.expr.ident('x'),
                                                            [['x',ast.expr.ident('l')]],
                                                            [ast.expr.ident("b")])).success(),
                 "runtime.apply(runtime.invoke(runtime.apply(runtime.invoke(mvc$l,'filter'),runtime.lazy(function(){return function(mvc$x){return runtime.ident('b');};})),'map'),runtime.lazy(function(){return function(mvc$x){return mvc$x;};}))");
      test.done();
  },
    
  'Simple Empty Tag': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list(), ast.expr.tag("A",[],[])).success(),
                 "runtime.tag('A',[],[])");
      test.done();
  },
    
  'Empty Tag with one attribute': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')]],[])).success(),
                 "runtime.tag('A',[['a',runtime.string('b')]],[])");
      test.done();
  },
    
  'Empty Tag with two attributes': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')],['b',ast.expr.number(1)]],[])).success(),
                 "runtime.tag('A',[['a',runtime.string('b')],['b',runtime.number(1)]],[])");
      test.done();
  },
    
  'Tag with a simple content': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('l'), ast.expr.tag("A",[],[ast.expr.tag("B",[],[]),ast.expr.number(1)])).success(),
                 "runtime.tag('A',[],[runtime.tag('B',[],[]),runtime.number(1)])");
      test.done();
  },
};
    