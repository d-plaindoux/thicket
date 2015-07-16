'use strict';

var types = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/checker/types.js'),
    ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/ast.js'),
    list = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/list.js'),
    pair = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/pair.js');     

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

exports['types_unify'] = {
  setUp: function(done) {
    done();
  },

  "Unify native & native": function (test) {
      test.expect(1);
      // Test
      test.ok(types.unify(ast.type.native("a"),
                          ast.type.native("a")).success().isEmpty(), 
              "Unify native");
      test.done();
  },

  "Unify failure native & native": function (test) {
      test.expect(1);
      // Test
      test.ok(types.unify(ast.type.native("a"),
                          ast.type.native("b")).isFailure(), 
              "Unify failure native");
      test.done();
  },
    
  "Unify variable & native": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.unify(ast.type.variable("b"),
                                 ast.type.native("a")).success(), 
              list(pair("b",ast.type.native("a"))),
              "Unify variable & native");
      test.done();
  },
    
  "Unify native & variable": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.unify(ast.type.native("a"),
                                 ast.type.variable("a")).success(), 
              list(pair("a",ast.type.native("a"))),
              "Unify variable & native");
      test.done();
  },
    
  "Unify function native & native": function (test) {
      test.expect(1);
      // Test
      test.equal(types.unify(ast.type.abstraction(ast.type.native("a"),ast.type.native("b")),
                             ast.type.native("a")).isSuccess(), 
                 false, 
                 "Unify function native & native");
      test.done();
  },
    
  "Unify function native & function native": function (test) {
      test.expect(1);
      // Test
      test.ok(types.unify(ast.type.abstraction(ast.type.native("a"),ast.type.native("b")),
                          ast.type.abstraction(ast.type.native("a"),ast.type.native("b"))).success().isEmpty(), 
              "Unify function native & function native");
      test.done();
  },
    
  "Unify function failure native & function native": function (test) {
      test.expect(1);
      // Test
      test.ok(types.unify(ast.type.abstraction(ast.type.native("a"),ast.type.native("b")),
                          ast.type.abstraction(ast.type.native("b"),ast.type.native("a"))).isFailure(), 
              "Unify function native & function native");
      test.done();
  },
    
  "Unify function variable & function native": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.unify(ast.type.abstraction(ast.type.variable("b"),ast.type.variable("a")),
                                 ast.type.abstraction(ast.type.native("a"),ast.type.native("b"))).success(), 
                     list(pair("b",ast.type.native("a")),pair("a",ast.type.native("b"))),
                     "Unify function variable & function native");
      test.done();
  },
    
  "Unify function native & function variable": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.unify(ast.type.abstraction(ast.type.native("b"),ast.type.native("a")),
                                 ast.type.abstraction(ast.type.variable("a"),ast.type.variable("b"))).success(), 
                     list(pair("a",ast.type.native("b")),pair("b",ast.type.native("a"))),
                     "Unify function native & function variable");
      test.done();
  },  
    
  "Unify function with required subtitution": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.unify(ast.type.abstraction(ast.type.native("b"),ast.type.variable("a")),
                                 ast.type.abstraction(ast.type.variable("a"),ast.type.native("b"))).success(), 
                     list(pair("a",ast.type.native("b"))),
                     "Unify with substitution");
      test.done();
  },  
    
  "Do not unify function with required substitution": function (test) {
      test.expect(1);
      // Test
      test.ok(types.unify(ast.type.abstraction(ast.type.native("b"),ast.type.variable("a")),
                          ast.type.abstraction(ast.type.variable("a"),ast.type.native("c"))).isFailure(), 
              "Unify failure function native & function native");
      test.done();
  },  
    
  "Do not unify cyclic dependency": function (test) {
      test.expect(1);
      // Test
      test.ok(types.unify(ast.type.variable("a"), ast.type.list(ast.type.variable("a"))).isFailure(), 
              "Unify cyclic dependency");
      test.done();
  },  
    
  "Unify same type variable": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.unify(ast.type.variable("a"), ast.type.variable("a")).success(), 
                     list(),
                     "Unify same type variable");
      test.done();
  },      

  "Unify embedded variable": function (test) {
      test.expect(1);
      // Test
      var model = ast.type.forall(["z"],ast.model("A",[ast.type.variable("z")],[]));
      test.deepEqual(types.unify(ast.type.abstraction(ast.type.variable("X"),ast.type.specialize(model,ast.type.variable("X"))),
                                 ast.type.abstraction(ast.type.variable("a"),ast.type.specialize(model,ast.type.variable("b")))).success(), 
                     list(pair("X",ast.type.variable("b")),pair("a",ast.type.variable("b"))),
              "Unify embedded variables");
      test.done();
  },  
};
 