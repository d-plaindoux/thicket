'use strict';

var list = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/list.js').list,
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
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['lists'] = {
  setUp: function(done) {
    done();
  },
    
  'empty list': function(test) {
    test.expect(1);
    // tests here  
    test.equal(list().isEmpty(), true, 'should be empty.');
    test.done();
  },

  'non empty list': function(test) {
    test.expect(1);
    // tests here  
    test.equal(list(1).isEmpty(), false, 'should not be empty.');
    test.done();
  },

  'contained element in list': function(test) {
    test.expect(1);
    // tests here  
    test.equal(list(1,2,3).contains(1), true, 'should contains 1.');
    test.done();
  },

  'not contained element in list': function(test) {
    test.expect(1);
    // tests here  
    test.equal(list(1,2,3).contains(0), false, 'should not contains 0.');
    test.done();
  },

  'map integer list': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(list(1,2,3).map(function (v) { return v+1; }), list(2,3,4), 'should map.');
    test.done();
  },
    
  'flatmap integer list': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(list(1,2,3).flatmap(function (v) { return list(v,v+1); }), list(1,2,2,3,3,4), 'should flatmap.');
    test.done();
  },

  'foldR integer list': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(list(1,2,3).foldR(function (v,a) { return v + "" + a; }, 0), "1230", 'should foldR.');
    test.done();
  },

  'foldL integer list': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(list(1,2,3).foldL(0, function (a,v) { return v + "" + a; }), "3210", 'should foldL.');
    test.done();
  },

  'Zip list 1': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(list(1,2,3).zipWith(list('a','b')), list(pair(1,'a'), pair(2,'b')), 'should zip.');
    test.done();
  },

  'Zip list 2': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(list(1,2).zipWith(list('a','b','c')), list(pair(1,'a'), pair(2,'b')), 'should zip.');
    test.done();
  },
    
  'Substract a list': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(list(1,2).minus(list(1,2,3)), list(), "minud two lists");
    test.done();
  } 
};
