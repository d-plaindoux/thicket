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
                 "M.model('A',{$:'A'})");
      test.done();
  },

  'Model with one attribute': function (test) {
      test.expect(1);
      
      test.equal(compiler.model(ast.model("A",[],[ast.param("a",ast.type.native("a"))])).success(),
                 "M.model('A',function(mvc$a){return {$:'A','a':mvc$a}})");
      test.done();
  },

  'Model with two attributes': function (test) {
      test.expect(1);
      
      test.equal(compiler.model(ast.model("A",list(),[ast.param("a1",ast.type.native("a")),
                                                  ast.param("a2",ast.type.native("b"))])).success(), 
                 "M.model('A',function(mvc$a1){return function(mvc$a2){return {$:'A','a1':mvc$a1,'a2':mvc$a2}}})");
      test.done();
  },
    
  'Simple controller': function (test) {
      test.expect(1);
      
      test.equal(compiler.controller(list(), ast.controller("A",[],ast.param("this",ast.type.native("a")),[],[])).success(),
                 "M.controller('A',function(mvc$this){return {$:'A'};})");
      test.done();
  },
    
  'Controller with unbox': function (test) {
      test.expect(1);
      
      test.equal(compiler.controller(list(), ast.controller("A",[],
                                                        ast.param("this",ast.type.native("a")),
                                                        [],
                                                        [ast.method("unbox", ast.expr.ident("this"))])).success(),
                 "M.controller('A',function(mvc$this){return {$:'A','unbox':mvc$this};})");
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
};
    