'use strict';

var option = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/option.js').option;

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
    test.equal(option.empty().isPresent(), false, 'should be empty option.');
    test.done();
  },

  'option not empty': function(test) {
    test.expect(1);
    // tests here      
    test.equal(option.some(12).isPresent(), true, 'should not be empty option.');
    test.done();
  },
    
  'option empty mapped': function(test) {
    test.expect(1);
    // tests here      
    test.equal(option.empty().map(function(a){return a;}).isPresent(), false, 'should be empty option.');
    test.done();
  },
    
  'option not empty mapped': function(test) {
    test.expect(1);
    // tests here      
    test.equal(option.some(12).map(function(a){return a;}).get(), 12, 'should not be empty option.');
    test.done();
  },
    
  'option not empty flat mapped to option': function(test) {
    test.expect(1);
    // tests here      
    test.equal(option.some(12).flatmap(function(a){return option.some(a);}).get(), 12, 'should not be empty option.');
    test.done();
  },
    
  'option not empty flat mapped to int': function(test) {
    test.expect(1);
    // tests here      
    test.equal(option.some(12).flatmap(function(a){return a;}).get(), 12, 'should not be empty option.');
    test.done();
  },
    
  'option empty flat mapped': function(test) {
    test.expect(1);
    // tests here      
    test.equal(option.some().flatmap(function(a){return a;}).isPresent(), false, 'should be empty option.');
    test.done();
  },
    
  'option empty or else': function(test) {
    test.expect(1);
    // tests here      
    test.equal(option.empty().orElse(12), 12, 'should be empty option.');
    test.done();
  },
    
  'option not empty or else': function(test) {
    test.expect(1);
    // tests here      
    test.equal(option.some(12).orElse(14), 12, 'should be empty option.');
    test.done();
  },
};
