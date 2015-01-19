'use strict';

var ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/ast.js').ast,
    compiler = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/compiler.js').compiler;

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

exports['compile'] = {
  setUp: function(done) {
      done();
  },

  'Simple model': function (test) {
      test.expect(1);
      
      compiler.model(ast.model("A",[],[]));
      test.ok(true);
      test.done();
  },
};
    