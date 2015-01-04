'use strict';

var entities = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/entities.js').entities,
    ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/ast.js').ast,
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

exports['entities_freevar'] = {
  setUp: function(done) {
      done();
  },

  "Freevar for an empty model": function (test) {
      test.expect(1);
      // Test
      var aModel = ast.model("A",[],[]);
      test.deepEqual(entities.freeVariables(aModel),
                     list(),
                     "Empty model");
      test.done();
  },    
    
  "Freevar for a closed model": function (test) {
      test.expect(1);
      // Test
      var aModel = ast.model("A",[],[ ast.param('m', ast.type.native('a'))]);
      test.deepEqual(entities.freeVariables(aModel),
                     list(),
                     "Closed model");
      test.done();
  },
    
  "Freevar for an opened model": function (test) {
      test.expect(1);
      // Test
      var aModel = ast.model("A",[],[ ast.param('m', ast.type.variable('a'))]);
      test.deepEqual(entities.freeVariables(aModel),
                     list('a'),
                     "Closed model");
      test.done();
  },
    
  "Freevar for a generic model": function (test) {
      test.expect(1);
      // Test
      var aModel = ast.model("A",['a'],[ ast.param('m', ast.type.variable('a'))]);
      test.deepEqual(entities.freeVariables(aModel),
                     list(),
                     "Closed model");
      test.done();
  },

  "Freevar for an empty controller with closed object": function (test) {
      test.expect(1);
      // Test
      var aController = ast.controller("A",[],ast.param("t",ast.type.native('a')),[],[]);
      test.deepEqual(entities.freeVariables(aController),
                     list(),
                     "Empty model");
      test.done();
  },        

  "Freevar for an empty controller with open object": function (test) {
      test.expect(1);
      // Test
      var aController = ast.controller("A",[],ast.param("t",ast.type.variable('a')),[],[]);
      test.deepEqual(entities.freeVariables(aController),
                     list('a'),
                     "Empty model");
      test.done();
  },
    
  "Freevar for a genetic controller with open object": function (test) {
      test.expect(1);
      // Test
      var aController = ast.controller("A",['a'],ast.param("t",ast.type.variable('a')),[],[]);
      test.deepEqual(entities.freeVariables(aController),
                     list(),
                     "Empty model");
      test.done();
  },
    
  "Freevar for non empty closed controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.controller("A",[],ast.param("t",ast.type.native('a')),[ ast.param("t",ast.type.native('a')) ],[]);
      test.deepEqual(entities.freeVariables(aController),
                     list(),
                     "Non empty model");
      test.done();
  },    
    
  "Freevar for non empty generic opened controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.controller("A",['a'],ast.param("t",ast.type.native('a')),[ ast.param("t",ast.type.variable('a')) ],[]);
      test.deepEqual(entities.freeVariables(aController),
                     list(),
                     "Non empty model");
      test.done();
  },    

  "Freevar for an empty view with closed object": function (test) {
      test.expect(1);
      // Test
      var aView = ast.view("A",[],ast.param("t",ast.type.native('a')),ast.expr.tag("a"));
      test.deepEqual(entities.freeVariables(aView),
                     list(),
                     "Empty model");
      test.done();
  },        

  "Freevar for an empty view with open object": function (test) {
      test.expect(1);
      // Test
      var aView = ast.view("A",[],ast.param("t",ast.type.variable('a')),ast.expr.tag("a"));
      test.deepEqual(entities.freeVariables(aView),
                     list('a'),
                     "Empty model");
      test.done();
  },
    
  "Freevar for a genetic view with open object": function (test) {
      test.expect(1);
      // Test
      var aView = ast.view("A",['a'],ast.param("t",ast.type.variable('a')),ast.expr.tag("a"));
      test.deepEqual(entities.freeVariables(aView),
                     list(),
                     "Empty model");
      test.done();
  },};
