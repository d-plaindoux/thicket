'use strict';

var ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/ast.js').ast,
    list = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/list.js').list,
    compiler = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/compiler.js').compiler;

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
      
      test.equal(compiler.model(ast.model("A",[],[])).success(),
                 "M.define('A',M.instance({$:'A'}))");
      test.done();
  },

  'Model with one attribute': function (test) {
      test.expect(1);
      
      test.equal(compiler.model(ast.model("A",[],[ast.param("a",ast.type.native("a"))])).success(),
                 "M.define('A',function(mvc$a){return M.instance({$:'A','a':mvc$a});})");
      test.done();
  },

  'Model with two attributes': function (test) {
      test.expect(1);
      
      test.equal(compiler.model(ast.model("A",list(),[ast.param("a1",ast.type.native("a")),
                                                  ast.param("a2",ast.type.native("b"))])).success(), 
                 "M.define('A',function(mvc$a1){return function(mvc$a2){return M.instance({$:'A','a1':mvc$a1,'a2':mvc$a2});};})");
      test.done();
  },
    
  'Simple controller': function (test) {
      test.expect(1);
      
      test.equal(compiler.controller(list(), ast.controller("A",[],ast.param("this",ast.type.native("a")),[],[])).success(),
                 "M.define('A',function(mvc$this){return M.controller(function(self){return {$:'A'});)};)");
      test.done();
  },
    
  'Controller with unbox': function (test) {
      test.expect(1);
      
      test.equal(compiler.controller(list(), ast.controller("A",[],
                                                        ast.param("this",ast.type.native("a")),
                                                        [],
                                                        [ast.method("unbox", ast.expr.ident("this"))])).success(),
                 "M.define('A',function(mvc$this){return M.controller(function(self){return {$:'A','unbox':mvc$this});)};)");
      test.done();
  },
    
  'Number': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list(), ast.expr.number(1)).success(),
                 "M.number(1)");
      test.done();
  },
    
  'String': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list(), ast.expr.string("1")).success(),
                 "M.string('1')");
      test.done();
  },
    
  'Unit': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list(), ast.expr.unit()).success(),
                 "M.unit");
      test.done();
  },
    
  'Pair': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list('Pair'), list(), ast.expr.pair(ast.expr.number(1),ast.expr.string("1"))).success(),
                 "M.apply(M.apply(M.ident('Pair'),M.lazy(function(){return M.number(1);})),M.lazy(function(){return M.string('1');}))");
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
                 "M.ident('a')");
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
                 "M.apply(mvc$a,M.lazy(function(){return mvc$b;}))");
      test.done();
  },
    
  'Invoke expression': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('a', 'b'), ast.expr.invoke(ast.expr.ident("a"), "b")).success(),
                 "M.invoke(mvc$a,'b')");
      test.done();
  },
    
  'Apply/Invoke expression': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('a'), ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b"))).success(),
                 "M.invoke(mvc$a,'b')");
      test.done();
  },
    
  'Let expression': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('a'), ast.expr.let("b",ast.expr.ident("a"),ast.expr.ident("b"))).success(),
                 "M.apply(function(mvc$b){return mvc$b;},M.lazy(function(){return mvc$a;}))");
      test.done();
  },
    
  'Comprehension expression': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('l'), ast.expr.comprehension(ast.expr.ident('x'),[['x',ast.expr.ident('l')]],[])).success(),
                 "M.apply(M.invoke(mvc$l,'map'),M.lazy(function(){return function(mvc$x){return mvc$x;};}))");
      test.done();
  },
    
  'Comprehension expression with condition': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), 
                                     list('l'), 
                                     ast.expr.comprehension(ast.expr.ident('x'),
                                                            [['x',ast.expr.ident('l')]],
                                                            [ast.expr.ident("b")])).success(),
                 "M.apply(M.invoke(M.apply(M.invoke(mvc$l,'filter'),M.lazy(function(){return function(mvc$x){return M.ident('b');};})),'map'),M.lazy(function(){return function(mvc$x){return mvc$x;};}))");
      test.done();
  },
    
  'Simple Empty Tag': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('l'), ast.expr.tag("A",[],[])).success(),
                 "M.tag('A',[],[])");
      test.done();
  },
    
  'Empty Tag with one attribute': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')]],[])).success(),
                 "M.tag('A',[['a',M.string('b')]],[])");
      test.done();
  },
    
  'Empty Tag with two attributes': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')],['b',ast.expr.number(1)]],[])).success(),
                 "M.tag('A',[['a',M.string('b')],['b',M.number(1)]],[])");
      test.done();
  },
    
  'Tag with a simple content': function (test) {
      test.expect(1);
      
      test.equal(compiler.expression(list(), list('l'), ast.expr.tag("A",[],[ast.expr.tag("B",[],[]),ast.expr.number(1)])).success(),
                 "M.tag('A',[],[M.tag('B',[],[]),M.number(1)])");
      test.done();
  },
};
    