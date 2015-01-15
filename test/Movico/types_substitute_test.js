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
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), ast.type.native("a"), true), 
                     ast.type.native("a"), 
                     "Substitute native");
      test.done();
  },

  "Subtitute native list is identity": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), ast.type.list(ast.type.native("a")), true),
                     ast.type.list(ast.type.native("a")), 
                     "Substitute list");
      test.done();
  },

  "Subtitute native pair is identity": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), ast.type.pair(ast.type.native("a"),ast.type.native("b")), true),
                     ast.type.pair(ast.type.native("a"),ast.type.native("b")),
                     "Substitute pair");
      test.done();
  },

  "Subtitute native function is identity": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), ast.type.abstraction(ast.type.native("a"),ast.type.native("b")), true),
                     ast.type.abstraction(ast.type.native("a"),ast.type.native("b")),
                     "Substitute function");
      test.done();
  },

  "Subtitute variable is identity": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), ast.type.variable("a"), true),  
                     ast.type.variable("a"), 
                     "Substitute variable");
      test.done();
  },

  "Subtitute bound variable": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), ast.type.variable("x"), true), 
                     ast.type.native("y"), 
                     "Substitute bound variable");
      test.done();
  },

  "Subtitute list bound variable": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), 
                                      ast.type.list(ast.type.variable("x")), true), 
                     ast.type.list(ast.type.native("y")), 
                     "Substitute list bound variable");
      test.done();
  },

  "Subtitute pair bound variable": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), 
                                      ast.type.pair(ast.type.variable("x"),ast.type.variable("x")), true), 
                     ast.type.pair(ast.type.native("y"),ast.type.native("y")), 
                     "Substitute pair bound variable");
      test.done();
  },

  "Subtitute function bound variable": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.substitute(list(pair("x",ast.type.native("y"))), 
                                      ast.type.abstraction(ast.type.variable("x"),ast.type.variable("x")), true), 
                     ast.type.abstraction(ast.type.native("y"),ast.type.native("y")), 
                     "Substitute function bound variable");
      test.done();
  },

  "Subtitute model": function (test) {
      test.expect(1);
      // Test
      var entity = ast.model("A",[],[ast.param("f",ast.type.variable("b"))]);
      test.deepEqual(types.substitute(list(pair("b",ast.type.native("y"))), entity, true),
                     ast.model("A",[],[ast.param("f",ast.type.native("y"))]),
                     "Substitute model");
      test.done();
  },
    
  "Subtitute model with non free variable": function (test) {
      test.expect(1);
      // Test
      var entity = ast.type.forall(["b"], ast.model("A",[ast.type.variable("b")],[ast.param("f",ast.type.variable("b"))]));
      test.deepEqual(types.substitute(list(pair("b",ast.type.native("y"))), entity, true),
                     entity,
                     "Substitute model");
      test.done();
  },

  "Subtitute controller": function (test) {
      test.expect(1);
      // Test
      var entity = ast.controller("A",[],ast.param("this", ast.type.variable("b")),[ast.param("f",ast.type.variable("b"))],[]);
      test.deepEqual(types.substitute(list(pair("b",ast.type.native("y"))), entity, true),
                    ast.controller("A",[],ast.param("this", ast.type.native("y")),[ast.param("f",ast.type.native("y"))],[]),
                     "Substitute controller");
      test.done();
  },
    
  "Subtitute controller with non free variable": function (test) {
      test.expect(1);
      // Test
      var entity = ast.type.forall(["b"], ast.controller("A",[ast.type.variable('b')],ast.param("this", ast.type.variable("b")),[ast.param("f",ast.type.variable("b"))],[]));
      test.deepEqual(types.substitute(list(pair("b",ast.type.native("y"))), entity, true), 
                    entity,
                     "Substitute controller");
      test.done();
  },
    
  "Subtitute view": function (test) {
      test.expect(1);
      // Test
      var entity = ast.view("A",[],ast.param("this", ast.type.variable("b")),[]);
      test.deepEqual(types.substitute(list(pair("b",ast.type.native("y"))), entity, true),
                    ast.view("A",[],ast.param("this", ast.type.native("y")),[]),
                     "Substitute view");
      test.done();
  },
    
  "Subtitute view with non free variable": function (test) {
      test.expect(1);
      // Test
      var entity = ast.type.forall(["b"], ast.view("A",[ast.type.variable('b')],ast.param("this", ast.type.variable("b")),[]));
      test.deepEqual(types.substitute(list(pair("b",ast.type.native("y"))), entity, true), 
                    entity,
                     "Substitute view");
      test.done();
  },
};
 