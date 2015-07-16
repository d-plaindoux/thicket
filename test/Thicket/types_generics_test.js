'use strict';

var pair = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/pair.js'),
    types = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/checker/types.js'),
    ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/ast.js'),
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

exports['types_generics'] = {
  setUp: function(done) {
    done();
  },

  "Model with generics": function (test) {
      test.expect(1);
      // Test
      var entity = ast.type.forall(["a"], ast.model("A",[ast.type.variable("a")],[]));
      test.deepEqual(types.genericsAndType(entity),
                     pair(list("a"),entity.type),
                     "Generics and model");
      test.done();
  },
    
  "Controller with generics": function (test) {
      test.expect(1);
      // Test
      var entity = ast.type.forall(["a"], ast.controller("A",[],ast.param("this",ast.type.native("number")),[],[]));
      test.deepEqual(types.genericsAndType(entity),
                     pair(list("a"),entity.type),
                     "Generics and controller");
      test.done();
  },

  "Forall": function (test) {
      test.expect(1);
      // Test
      var entity = ast.type.forall(["a"],ast.type.variable("a"));
      test.deepEqual(types.genericsAndType(entity),
                     pair(list("a"),entity.type),
                     "Generics and forall");
      test.done();
  },
};