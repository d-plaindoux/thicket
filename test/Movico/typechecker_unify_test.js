'use strict';

var typechecker = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/typechecker.js').typechecker,
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

exports['typechecker'] = {
  setUp: function(done) {
    done();
  },
    
  "Unify native": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.ok(aTypeChecker.unify(ast.type.native('int'), ast.type.native('int')),
              "Unifying native");
      test.done();
  },
    
  "Unify variable and native": function (test) {
      test.expect(2);
      // Test
      var aTypeChecker = typechecker(entities()),
          variable = ast.type.ident("a");

      test.ok(aTypeChecker.unify(variable, ast.type.native("int")), "Unifying model");
      test.deepEqual(variable.reference.orElse(null), ast.type.native("int"), "Unifying model");
      test.done();
  },
    
  "Unify model": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.ok(aTypeChecker.unify(ast.model('a',[]), ast.model('a',[])),
              "Unifying model");
      test.done();
  },
    
  "Unify pairs": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.ok(aTypeChecker.unify(ast.type.pair(ast.type.native('int'),ast.type.native('string')),
                                 ast.type.pair(ast.type.native('int'),ast.type.native('string'))),
              "Unifying pair");
      test.done();
  },
    
  "Unify function": function (test) {
      test.expect(1);
      // Test
      var aTypeChecker = typechecker(entities());  

      test.ok(aTypeChecker.unify(ast.type.fun(ast.type.native('int'),ast.type.native('string')),
                                 ast.type.fun(ast.type.native('int'),ast.type.native('string'))),
              "Unifying pair");
      test.done();
  },
};
