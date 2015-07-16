'use strict';

var runtime = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/runtime/runtime.js');  

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

exports['runtime_pretty'] = {
  setUp: function(done) {
    done();
  },
 
  'Number': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(runtime.pretty({"CONST":123}),
                   '123');
    test.done();
  },

  'String': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(runtime.pretty({"CONST":"123"}),
                   '"123"');
    test.done();
  },

};