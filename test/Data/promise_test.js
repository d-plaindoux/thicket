'use strict';

var promise = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/promise.js');

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

exports['promise'] = {
  setUp: function(done) {
    done();
  },
    
  'promise success': function(test) {
    test.expect(1);
    // tests here  
    var aPromise = promise(),
        success = false;
      
    aPromise.success(1);
      
    test.ok(!success);
      
    test.done();
  },
    
  'promise response and success': function(test) {
    test.expect(1);
    // tests here  
    var aPromise = promise(),
        success = false;
      
    aPromise.success(1);
      
    aPromise.future().onResult(function() {
        success = true;
    });
      
    test.ok(success);
      
    test.done();
  },
    
  'promise success and response': function(test) {
    test.expect(1);
    // tests here  
    var aPromise = promise(),
        success = false;
      
    aPromise.future().onResult(function() {
        success = true;
    });
      
    aPromise.success(1);
      
    test.ok(success);
      
    test.done();
  },
           
  'promise failure': function(test) {
    test.expect(1);
    // tests here  
    var aPromise = promise(),
        failure = false;
      
    aPromise.failure(1);
      
    test.ok(!failure);
      
    test.done();
  },

    
  'promise response and failure': function(test) {
    test.expect(1);
    // tests here  
    var aPromise = promise(),
        failure = false;
      
    aPromise.failure(1);
      
    aPromise.future().onResult(null, function() {
        failure = true;
    });
      
    test.ok(failure);
      
    test.done();
  },
    
  'promise failure and response': function(test) {
    test.expect(1);
    // tests here  
    var aPromise = promise(),
        failure = false;

    aPromise.future().onResult(null, function() {
        failure = true;
    });
      
    aPromise.failure(1);
      
    test.ok(failure);
      
    test.done();
  },
};
