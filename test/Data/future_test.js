'use strict';

var future = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/future.js');

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

exports['future'] = {
  setUp: function(done) {
    done();
  },
    
  'future success': function(test) {
    test.expect(1);
    // tests here  
    var aFuture = future(),
        success = false;
      
    aFuture.success(1);
      
    test.ok(!success);
      
    test.done();
  },
    
  'future response and success': function(test) {
    test.expect(1);
    // tests here  
    var aFuture = future(),
        success = false;
      
    aFuture.success(1);
      
    aFuture.onResult(function() {
        success = true;
    });
      
    test.ok(success);
      
    test.done();
  },
    
  'future success and response': function(test) {
    test.expect(1);
    // tests here  
    var aFuture = future(),
        success = false;
      
    aFuture.onResult(function() {
        success = true;
    }).success(1);
      
    test.ok(success);
      
    test.done();
  },
           
  'future failure': function(test) {
    test.expect(1);
    // tests here  
    var aFuture = future(),
        failure = false;
      
    aFuture.failure(1);
      
    test.ok(!failure);
      
    test.done();
  },

    
  'future response and failure': function(test) {
    test.expect(1);
    // tests here  
    var aFuture = future(),
        failure = false;
      
    aFuture.failure(1);
      
    aFuture.onResult(null, function() {
        failure = true;
    });
      
    test.ok(failure);
      
    test.done();
  },
    
  'future failure and response': function(test) {
    test.expect(1);
    // tests here  
    var aFuture = future(),
        failure = false;
      
    aFuture.onResult(null, function() {
        failure = true;
    }).failure(1);
      
    test.ok(failure);
      
    test.done();
  },
};
