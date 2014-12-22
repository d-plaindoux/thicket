'use strict';

var expression = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/expressions.js').expressions,
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

exports['entities'] = {
  setUp: function(done) {
    done();
  },

  "Analyse Number": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.number(1);
      test.deepEqual(expression.analyse(list(), anExpression).success(), 
                     pair(list(),ast.type.native('number')), 
                     "Must be number");
      test.done();
  },
    
  "Analyse String": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.string("1");
      test.deepEqual(expression.analyse(list(), anExpression).success(), 
                     pair(list(),ast.type.native('string')), 
                     "Must be string");
      test.done();
  },
    
  "Analyse free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.ident("a");
      test.ok(expression.analyse(list(), anExpression).isFailure(),
              "Must be unbound");
      test.done();
  },
    
  "Analyse bound variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.ident("a");
      test.deepEqual(expression.analyse(list(ast.param("a", ast.type.native("string"))), anExpression).success(),
                     pair(list(), ast.type.native("string")),
                     "Must be string");
      test.done();
  },

    
  "Analyse Native pair": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.pair(ast.expr.number('1'), ast.expr.string('a'));
      test.deepEqual(expression.analyse(list(), anExpression).success(), 
                     pair(list(),ast.type.pair(ast.type.native('number'), ast.type.native('string'))), 
                     "Must be (int,string)");
      test.done();
  },
};
