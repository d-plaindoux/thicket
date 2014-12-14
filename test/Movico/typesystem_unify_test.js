'use strict';

var typesystem = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/typesystem.js').typesystem,
    entities = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/entities.js').entities,
    ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/ast.js').ast;
    

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

exports['typesystem_unify'] = {
  setUp: function(done) {
    done();
  },
    
  "Unify native": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typesystem(entities());  

      test.ok(aTypeChecker.unify([], ast.type.native('int'), ast.type.native('int')).isPresent,
              "Unifying native");
      test.done();
  },
    
  "Unify variable and native": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typesystem(entities()),
          variable = ast.type.variable("a");

      test.ok(aTypeChecker.unify([], variable, ast.type.native("int")).isPresent(), "Unifying model");
      test.done();
  },
    
  "Unify model": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typesystem(entities());  

      test.ok(aTypeChecker.unify([], ast.model('a',[]), ast.model('a',[])).isPresent(),
              "Unifying model");
      test.done();
  },
    
  "Unify pairs": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typesystem(entities());  

      test.ok(aTypeChecker.unify([],
                                 ast.type.pair(ast.type.native('int'),ast.type.native('string')),
                                 ast.type.pair(ast.type.native('int'),ast.type.native('string'))).isPresent(),
              "Unifying pair");
      test.done();
  },
    
  "Unify function": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typesystem(entities());  

      test.ok(aTypeChecker.unify([],
                                 ast.type.abstraction(ast.type.native('int'),ast.type.native('string')),
                                 ast.type.abstraction(ast.type.native('int'),ast.type.native('string'))).isPresent(),
              "Unifying pair");
      test.done();
  },
};
