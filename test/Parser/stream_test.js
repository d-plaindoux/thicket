'use strict';

var stream = require('../../lib' + (process.env.MOVICO_COV || '') + '/Parser/stream.js');

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

exports['stream'] = {
  setUp: function(done) {
    done();
  },
    
  'empty stream': function(test) {
    test.expect(1);
    // tests here      
    test.equal(stream("").isEmpty(), true, 'should be empty.');
    test.done();
  },
    
  'not empty stream': function(test) {
    test.expect(1);
    // tests here      
    test.equal(stream("a").isEmpty(), false, 'should not be empty.');
    test.done();
  },
    
  'empty stream refuses token': function(test) {
    test.expect(1);
    // tests here      
    test.equal(stream("").nextToken('token').orElse(null), null, 'should be rejected.');
    test.done();
  },
    
  'stream accepts token': function(test) {
    test.expect(1);
    // tests here      
    test.notEqual(stream("a").nextToken("a").orElse(null), null, 'should be a lexeme.');
    test.done();
  },
    
  'stream accepts token and provide it': function(test) {
    test.expect(1);
    // tests here      
    test.equal(stream("a").nextToken("a").orElse(null), "a", 'should be a lexeme.');
    test.done();
  },
    
  'stream accepts token and provide an empty stream': function(test) {
    test.expect(1);
    // tests here      
    var aStream = stream("a");
    aStream.nextToken("a").orElse(null);
    test.equal(aStream.isEmpty(), true, 'should be empty.');
    test.done();
  },
    
  'stream accepts token and provide an non empty stream': function(test) {
    test.expect(1);
    // tests here      
    var aStream = stream("aa");
    aStream.nextToken("a");
    test.equal(aStream.isEmpty(), false, 'should not be empty.');
    test.done();
  },
        
  'stream rejects token': function(test) {
    test.expect(1);
    // tests here      
    var aStream = stream("a");
    test.equal(aStream.nextToken("b").orElse(null), null, 'should be rejected.');
    test.done();
  },
        
  'stream accepts two tokens': function(test) {
    test.expect(2);
    // tests here      
    var aStream = stream("ab");
    test.equal(aStream.nextRegexp(/^a/).orElse(null), "a", 'should be a lexeme.');
    test.equal(aStream.nextToken("b").orElse(null), "b", 'should be a lexeme.');
    test.done();
  },
            
  'stream accepts a regexp': function(test) {
    test.expect(1);
    // tests here      
    var aStream = stream("aab");
    test.notEqual(aStream.nextRegexp(/^a+/).orElse(null), null, 'should be a lexeme.');
    test.done();
  },

  'stream accepts a regexp a token and provide it': function(test) {
    test.expect(2);
    // tests here      
    var aStream = stream("aab");
    test.equal(aStream.nextRegexp(/^a+/).orElse(null), "aa", 'should be a lexeme.');
    test.equal(aStream.nextToken("b").orElse(null), "b", 'should be a token.');
    test.done();
  },
            
  'stream rejects a regexp': function(test) {
    test.expect(1);
    // tests here      
    var aStream = stream("aab");
    test.equal(aStream.nextRegexp(/^b+/).orElse(null), null, 'should be a lexeme.');
    test.done();
  },

  'stream accept an empty regexp': function(test) {
    test.expect(1);
    // tests here      
    var aStream = stream("aab");
    test.equal(aStream.nextRegexp(/^b*/).orElse(null), '', 'should be accepted.');
    test.done();
  },
};
