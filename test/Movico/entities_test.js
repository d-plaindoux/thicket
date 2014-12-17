'use strict';

var entities = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/entities.js').entities,
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

exports['entities'] = {
  setUp: function(done) {
    done();
  },

  "Entity existing": function (test) {
      test.expect(1);
      // Test
      var aEntities = entities().declare(ast.model('a',[]));
      test.deepEqual(aEntities.find('a').get(), ast.model('a',[]), "Must be a model");
      test.done();
  },

  "Entity not existing": function (test) {
      test.expect(1);
      // Test
      var aEntities = entities();
      test.equal(aEntities.find('a').isPresent(), false, "Must not be a model");
      test.done();
  }
};
 