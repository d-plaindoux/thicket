'use strict';

var entities = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/checker/entities.js'),
    ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/syntax/ast.js'),
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

exports['entities_freevar'] = {
  setUp: function(done) {
      done();
  },

  "Freevar for an empty model": function (test) {
      test.expect(1);
      // Test
      var aModel = ast.model("A",[],[]);
      test.deepEqual(entities.freeVariables(list(), aModel),
                     list(),
                     "Empty model");
      test.done();
  },    
   
  "Freevar for a closed model": function (test) {
      test.expect(1);
      // Test
      var aModel = ast.model("A",[],[ast.param('m', ast.type.native('a'))]);
      test.deepEqual(entities.freeVariables(list(), aModel),
                     list(),
                     "Closed model");
      test.done();
  },
    
  "Freevar for an opened model": function (test) {
      test.expect(1);
      // Test
      var aModel = ast.model("A",[],[ast.param('m', ast.type.variable('a'))]);
      test.deepEqual(entities.freeVariables(list(), aModel),
                     list('a'),
                     "Closed model");
      test.done();
  },
    
  "Freevar for a generic model": function (test) {
      test.expect(1);
      // Test
      var aModel = ast.type.forall(["a"], ast.model("A",[ast.type.variable('a')],[ ast.param('m', ast.type.variable('a'))]));
      test.deepEqual(entities.freeVariables(list(), aModel),
                     list(),
                     "Closed model");
      test.done();
  },

  "Freevar for an empty controller with closed object": function (test) {
      test.expect(1);
      // Test
      var aController = ast.controller("A",[],ast.param("t",ast.type.native('a')),[],[]);
      test.deepEqual(entities.freeVariables(list(), aController),
                     list(),
                     "Empty model");
      test.done();
  },        

  "Freevar for an empty controller with open object": function (test) {
      test.expect(1);
      // Test
      var aController = ast.controller("A",[],ast.param("t",ast.type.variable('a')),[],[]);
      test.deepEqual(entities.freeVariables(list(), aController),
                     list('a'),
                     "Empty model");
      test.done();
  },
    
  "Freevar for a genetic controller with open object": function (test) {
      test.expect(1);
      // Test
      var aController = ast.type.forall(["a"], ast.controller("A",[ast.type.variable('a')],ast.param("t",ast.type.variable('a')),[],[]));
      test.deepEqual(entities.freeVariables(list(), aController),
                     list(),
                     "Empty model");
      test.done();
  },
    
  "Freevar for non empty closed controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.controller("A",[],ast.param("t",ast.type.native('a')),[ ast.param("t",ast.type.native('a')) ],[]);
      test.deepEqual(entities.freeVariables(list(), aController),
                     list(),
                     "Non empty model");
      test.done();
  },    
    
  "Freevar for non empty generic opened controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.type.forall(["a"], ast.controller("A",[ast.type.variable('a')],ast.param("t",ast.type.native('a')),[ ast.param("t",ast.type.variable('a')) ],[]));
      test.deepEqual(entities.freeVariables(list(), aController),
                     list(),
                     "Non empty model");
      test.done();
  },    
};
