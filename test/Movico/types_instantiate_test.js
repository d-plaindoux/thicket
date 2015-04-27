'use strict';

var types = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/checker/types.js'),
    ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/syntax/ast.js');
    // list = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/list.js');     

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

exports['types_freevar'] = {
  setUp: function(done) {
    done();
  },

  "Fresh native": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.instantiate(ast.type.native("a")),
                     ast.type.native("a"),
                     "Fresh native is native");
      test.done();
  },

  "Fresh model": function (test) {
      test.expect(1);
      // Test
      
      types.reset();
      
      var entity = ast.type.forall(["a"], ast.model("A",[ast.type.variable("a")],[ast.param("f",ast.type.variable("a"))]));
      test.deepEqual(types.instantiate(entity),
                     ast.model("A",[ast.type.variable("'a")],[ast.param("f",ast.type.variable("'a"))]),
                     "Fresh model with generics");
      test.done();
  },

  "Fresh controller": function (test) {
      test.expect(1);
      // Test
      
      types.reset();
      
      var entity = ast.type.forall(["a"], ast.controller("A",[ast.type.variable('a')],ast.param("this",ast.type.variable("a")),[ast.param("f",ast.type.variable("a"))], []));
      test.deepEqual(types.instantiate(entity),
                     ast.controller("A",[ast.type.variable("'a")],ast.param("this",ast.type.variable("'a")),[ast.param("f",ast.type.variable("'a"))], []),
                     "Fresh controller with generics");
      test.done();
  },

  "Fresh view": function (test) {
      test.expect(1);
      // Test
      
      types.reset();
      
      var entity = ast.type.forall(["a"], ast.view("A",[ast.type.variable('a')],ast.param("this",ast.type.variable("a")),[]));
      test.deepEqual(types.instantiate(entity),
                     ast.view("A",[ast.type.variable("'a")],ast.param("this",ast.type.variable("'a")),[]),
                     "Fresh view with generics");
      test.done();
  },
        
  "Fresh forall": function (test) {
      test.expect(1);
      // Test
      
      types.reset();
      
      var entity = ast.type.forall(["a"],ast.type.variable("a"));
      test.deepEqual(types.instantiate(entity),
                     ast.type.variable("'a"),
                     "Fresh forall");
      test.done();
  },
};