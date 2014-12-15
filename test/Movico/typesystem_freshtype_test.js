'use strict';

var typesystem = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/typesystem.js').typesystem,
    entities = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/entities.js').entities,
    ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/ast.js').ast,
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

exports['typesystem_freshtype'] = {
  setUp: function(done) {
    done();
  },
  
  "Fresh native is native": function (test) {
      test.expect(1);
      
      // Test
      var aTypeSystem = typesystem(entities());  
      
      test.deepEqual(aTypeSystem.freshType([], ast.type.native('int')), ast.type.native('int'));
      test.done();
  },
  
  "Fresh variable is a new variable": function (test) {
      test.expect(1);
      
      // Test
      var aTypeSystem = typesystem(entities()),  
          variable = aTypeSystem.freshType([pair('a','b')], ast.type.variable('a'));
      test.deepEqual(variable, ast.type.variable('b'));
      test.done();
  }
};
