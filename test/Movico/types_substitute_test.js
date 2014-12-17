'use strict';

var types = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/types.js').types,
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

exports['types_subsitute'] = {
  setUp: function(done) {
    done();
  },

  "Subtitute native is identity": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), 
                                      ast.type.native("a")), 
                     ast.type.native("a"), 
                     "Substitute native");
      test.done();
  },

  "Subtitute native array is identity": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), 
                                      ast.type.array(ast.type.native("a"))), 
                     ast.type.array(ast.type.native("a")), 
                     "Substitute array");
      test.done();
  },

  "Subtitute native pair is identity": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), 
                                      ast.type.pair(ast.type.native("a"),ast.type.native("b"))), 
                     ast.type.pair(ast.type.native("a"),ast.type.native("b")),
                     "Substitute pair");
      test.done();
  },

  "Subtitute native function is identity": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), 
                                      ast.type.abstraction(ast.type.native("a"),ast.type.native("b"))), 
                     ast.type.abstraction(ast.type.native("a"),ast.type.native("b")),
                     "Substitute function");
      test.done();
  },

  "Subtitute variable is identity": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), 
                                      ast.type.variable("a")), 
                     ast.type.variable("a"), 
                     "Substitute variable");
      test.done();
  },

  "Subtitute bound variable": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), 
                                      ast.type.variable("x")), 
                     ast.type.native("y"), 
                     "Substitute bound variable");
      test.done();
  },

  "Subtitute array bound variable": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), 
                                      ast.type.array(ast.type.variable("x"))), 
                     ast.type.array(ast.type.native("y")), 
                     "Substitute array bound variable");
      test.done();
  },

  "Subtitute pair bound variable": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), 
                                      ast.type.pair(ast.type.variable("x"),ast.type.variable("x"))), 
                     ast.type.pair(ast.type.native("y"),ast.type.native("y")), 
                     "Substitute pair bound variable");
      test.done();
  },

  "Subtitute function bound variable": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), 
                                      ast.type.abstraction(ast.type.variable("x"),ast.type.variable("x"))), 
                     ast.type.abstraction(ast.type.native("y"),ast.type.native("y")), 
                     "Substitute function bound variable");
      test.done();
  },
};
 