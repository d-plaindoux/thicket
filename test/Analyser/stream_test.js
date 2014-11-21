'use strict';

var movico = require('../../src/Analyser/stream.js');

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
    test.equal(movico.stream("").isEmpty(), true, 'should be empty.');
    test.done();
  },
    
  'not empty stream': function(test) {
    test.expect(1);
    // tests here      
    test.equal(movico.stream("a").isEmpty(), false, 'should not be empty.');
    test.done();
  },
    
  'empty stream refuses token': function(test) {
    test.expect(1);
    // tests here      
    test.equal(movico.stream("").nextToken('token'), undefined, 'should be undefined.');
    test.done();
  },
    
  'stream accepts token': function(test) {
    test.expect(1);
    // tests here      
    test.notEqual(movico.stream("a").nextToken("a"), undefined, 'should be a lexeme.');
    test.done();
  },
    
  'stream accepts token and provide it': function(test) {
    test.expect(1);
    // tests here      
    test.equal(movico.stream("a").nextToken("a").value, "a", 'should be a lexeme.');
    test.done();
  },
    
  'stream accepts token and provide an empty stream': function(test) {
    test.expect(1);
    // tests here      
    var stream = movico.stream("a");
    stream.nextToken("a").accept();
    test.equal(stream.isEmpty(), true, 'should be a empty.');
    test.done();
  },
    
  'stream accepts token and provide an non empty stream': function(test) {
    test.expect(1);
    // tests here      
    var stream = movico.stream("aa");
    stream.nextToken("a").accept();
    test.equal(stream.isEmpty(), false, 'should not be a empty.');
    test.done();
  },
        
  'stream rejects token': function(test) {
    test.expect(1);
    // tests here      
    var stream = movico.stream("a");
    test.equal(stream.nextToken("b"), undefined, 'should be a reject.');
    test.done();
  },
};