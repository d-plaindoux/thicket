'use strict';

var ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/ast.js').ast,
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
                 "var mvc$A = {$ : 'A'};");
      test.done();
  },

  'Model with one attribute': function (test) {
      test.expect(1);
      
      test.equal(compiler.model(ast.model("A",[],[ast.param("a",ast.type.native("a"))])).success(),
                 "var mvc$A = function (mvc$a) { return {$ : 'A', 'a': mvc$a}};");
      test.done();
  },

  'Model with two attributes': function (test) {
      test.expect(1);
      
      test.equal(compiler.model(ast.model("A",[],[ast.param("a1",ast.type.native("a")),
                                                  ast.param("a2",ast.type.native("b"))])).success(), 
                 "var mvc$A = function (mvc$a1) { return function (mvc$a2) { return {$ : 'A', 'a1': mvc$a1, 'a2': mvc$a2}}};");
      test.done();
  },
    
  'Simple controller': function (test) {
      test.expect(1);
      
      test.equal(compiler.controller([], ast.controller("A",[],ast.param("this",ast.type.native("a")),[],[])).success(),
                 "var mvc$A = function (mvc$this) { return {$: 'A'}; };");
      test.done();
  },
    
  'Controller with unbox': function (test) {
      test.expect(1);
      
      test.equal(compiler.controller([], ast.controller("A",[],
                                                        ast.param("this",ast.type.native("a")),
                                                        [],
                                                        [ast.method("unbox", ast.expr.ident("this"))])).success(),
                 "var mvc$A = function (mvc$this) { return {$: 'A', 'unbox': mvc$this}; };");
      test.done();
  },
};
    