'use strict';

var option = require('../../src/Monad/option.js');

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
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['options'] = {
  setUp: function(done) {
    done();
  },
    
  'option empty': function(test) {
    test.expect(1);
    // tests here      
    test.equal(option.option().isPresent(), false, 'should be empty option.');
    test.done();
  },

  'option not empty': function(test) {
    test.expect(1);
    // tests here      
    test.equal(option.option(12).isPresent(), true, 'should not be empty option.');
    test.done();
  },
};
