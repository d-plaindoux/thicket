'use strict';

var atry = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/atry.js').atry;

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
    
  'atry success': function(test) {
    test.expect(1);
    // tests here  
    test.ok(atry.success(1).isSuccess(), 'should be success.');
    test.done();
  },
    
  'atry failure': function(test) {
    test.expect(1);
    // tests here  
    test.ok(atry.failure(1).isFailure(), 'should be failure.');
    test.done();
  },
     
  'atry success map can be a success': function(test) {
    test.expect(1);
    // tests here  
    test.ok(atry.success(1).map(function (i) { return i+1; }).isSuccess(), 'should be success.');
    test.done();
  },
     
  'atry success map can be a failure': function(test) {
    test.expect(1);
    // tests here  
    test.ok(atry.success(1).map(function () { throw new Error(); }).isFailure(), 'should be failure.');
    test.done();
  },
     
  'atry success map': function(test) {
    test.expect(1);
    // tests here  
    test.equal(atry.success(1).map(function (i) { return i+1; }).success(), 2, 'should be success.');
    test.done();
  },
     
  'atry failure map is a failure': function(test) {
    test.expect(1);
    // tests here  
    test.ok(atry.failure(1).map(function (i) { return i+1; }).isFailure(), 'should be failure.');
    test.done();
  },
     
  'atry failure map': function(test) {
    test.expect(1);
    // tests here  
    test.equal(atry.failure(1).map(function (i) { return i+1; }).failure(), 1, 'should be failure.');
    test.done();
  },
     
  'atry success flatmap of atry': function(test) {
    test.expect(1);
    // tests here  
    test.equal(atry.success(1).flatmap(function (i) { return atry.success(i+1); }).success(), 2, 'should be success.');
    test.done();
  },
         
  'atry success flatmap of int': function(test) {
    test.expect(1);
    // tests here  
    test.equal(atry.success(1).flatmap(function (i) { return i+1; }).success(), 2, 'should be success.');
    test.done();
  },
         
  'atry failure flatmap of int': function(test) {
    test.expect(1);
    // tests here  
    test.equal(atry.failure(1).flatmap(function (i) { return i+1; }).failure(), 1, 'should be failure.');
    test.done();
  },
         
  'atry failure flatmap of Error': function(test) {
    test.expect(1);
    // tests here  
    test.equal(atry.success(1).flatmap(function () { throw 1; }).failure(), 1, 'should be failure.');
    test.done();
  },
         
  'atry success orElse': function(test) {
    test.expect(1);
    // tests here  
    test.equal(atry.success(1).orElse(2), 1, 'should be success.');
    test.done();
  },
         
  'atry failure orElse': function(test) {
    test.expect(1);
    // tests here  
    test.equal(atry.failure(1).orElse(2), 2, 'should be failure.');
    test.done();
  },

};
