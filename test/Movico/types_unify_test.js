'use strict';

var types = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/types.js').types,
    ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/ast.js').ast,
    list = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/list.js').list,
    pair = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/pair.js').pair;     

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

  "Unify native & native": function (test) {
      test.expect(1);
      // Test
      test.ok(types.unify(ast.type.native("a"),
                          ast.type.native("a")).success().isEmpty(), 
              "Unify native");
      test.done();
  },
    
  "Unify variable & native": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.unify(ast.type.variable("a"),
                                 ast.type.native("a")).success(), 
              list(pair("a",ast.type.native("a"))),
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
    
  "Unify array native & native": function (test) {
      test.expect(1);
      // Test
      test.equal(types.unify(ast.type.array(ast.type.native("a")),
                             ast.type.native("a")).isSuccess(), 
                 false, 
                 "Unify array native & native");
      test.done();
  },

  "Unify native & array native": function (test) {
      test.expect(1);
      // Test
      test.equal(types.unify(ast.type.native("a"),
                            ast.type.array(ast.type.native("a"))).isSuccess(), 
                 false, 
                 "Unify array native & native");
      test.done();
  },
    
  "Unify array native & array native": function (test) {
      test.expect(1);
      // Test
      test.ok(types.unify(ast.type.array(ast.type.native("a")),
                          ast.type.array(ast.type.native("a"))).success().isEmpty(), 
              "Unify array native & array native");
      test.done();
  },
    
  "Unify pair native & native": function (test) {
      test.expect(1);
      // Test
      test.equal(types.unify(ast.type.pair(ast.type.native("a"),ast.type.native("b")),
                             ast.type.native("a")).isSuccess(), 
                 false, 
                 "Unify pair native & native");
      test.done();
  },
    
  "Unify pair native & pair native": function (test) {
      test.expect(1);
      // Test
      test.ok(types.unify(ast.type.pair(ast.type.native("a"),ast.type.native("b")),
                          ast.type.pair(ast.type.native("a"),ast.type.native("b"))).success().isEmpty(), 
              "Unify pair native & pair native");
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
};
 