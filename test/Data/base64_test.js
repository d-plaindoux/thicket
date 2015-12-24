'use strict';

var base64 = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/base64.js');

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

exports['bas64'] = {
  setUp: function(done) {
    done();
  },
    
  'encode decode': function(test) {
    test.expect(1);
    // tests here  
    test.equal(base64.decode(base64.encode("Hello World!")), "Hello World!");
    test.done();
  },

};
