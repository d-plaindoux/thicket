'use strict';

var native = require('../../lib' + (process.env.MOVICO_COV || '') + '/Runtime/native.js'),
    M = native(require('../../lib' + (process.env.MOVICO_COV || '') + '/Runtime/runtime.js'));

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

exports['native'] = {
  setUp: function(done) {
    done();
  },
    
  'numbers true comparison': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.deltarules["generic.=="](M.number(1))(M.number(1))(true)(false));
    test.done();
  },

  'numbers false comparison': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.deltarules["generic.=="](M.number(1))(M.number(2))(false)(true));
    test.done();
  },

  'strings true comparison': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.deltarules["generic.=="](M.string("1"))(M.string("1"))(true)(false));
    test.done();
  },

  'strings false comparison': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.deltarules["generic.=="](M.string("1"))(M.string("2"))(false)(true));
    test.done();
  },
    
  'numbers true <<': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.deltarules["generic.<<"](M.number(1))(M.number(2))(true)(false));
    test.done();
  },

  'numbers false <<': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.deltarules["generic.<<"](M.number(1))(M.number(1))(false)(true));
    test.done();
  },

  'strings true <<': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.deltarules["generic.<<"](M.string("1"))(M.string("2"))(true)(false));
    test.done();
  },

  'strings false <<': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.deltarules["generic.<<"](M.string("1"))(M.string("1"))(false)(true));
    test.done();
  },
    
  'strings catenation': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.deltarules["string.+"](M.string("1"))(M.string("1")), 
                   M.$$(M.string("11")));
    test.done();
  },
    
  'strings toNumber': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.deltarules["string.toNumber"](M.string("1"))(function(n) { return n;})(M.number(-1)),
                   M.$$(M.number(1)));
    test.done();
  },
        
  'strings hash': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.deltarules["string.hash"](M.string("1")),
                   M.$$(M.number(49)));
    test.done();
  },
   
  'numbers +': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.deltarules["number.+"](M.number(6))(M.number(2)),
                   M.$$(M.number(8)));
    test.done();
  },
   
  'numbers -': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.deltarules["number.-"](M.number(6))(M.number(2)),
                   M.$$(M.number(4)));
    test.done();
  },
   
  'numbers *': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.deltarules["number.*"](M.number(6))(M.number(2)),
                   M.$$(M.number(12)));
    test.done();
  },
   
  'numbers /': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.deltarules["number./"](M.number(6))(M.number(2)),
                   M.$$(M.number(3)));
    test.done();
  },
   
  'number toString': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.deltarules["number.toString"](M.number(6)),
                   M.$$(M.string("6")));
    test.done();
  },
     
};