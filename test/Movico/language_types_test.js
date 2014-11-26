'use strict';

var stream = require('../../lib/Parser/stream.js').stream;
var language = require('../../lib/Movico/language.js').language;

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

exports['language_type'] = {
  setUp: function(done) {
    done();
  },
    
  'simple named type is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("int");
        
    test.ok(language.parser.group('type').parse(aStream).isPresent(), "accept int type");
    test.done();
  },
    
  'simple named type (in parenthesis) is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("( int )");
        
    test.ok(language.parser.group('type').parse(aStream).isPresent(), "accept (int) type");
    test.done();
  },
    
  'simple named type witch open parenthesis is rejected': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("( int ");
        
    test.equal(language.parser.group('type').parse(aStream).isPresent(), false, "reject (int)type");
    test.done();
  },
    
  'simple named array type is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("[int]");
        
    test.ok(language.parser.group('type').parse(aStream).isPresent(), "accept [int] type");
    test.done();
  },
    
  'simple named unclosed array type is rejected': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("[int");
        
    test.equal(language.parser.group('type').parse(aStream).isPresent(), false, "reject [int type");
    test.done();
  },
    
  'tuple type (in parenthesis) is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("( int, string )");
        
    test.ok(language.parser.group('type').parse(aStream).isPresent(), "accept (int,string) type");
    test.done();
  },    
    
  'array of tuple type (in parenthesis) is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("[(int, string )]");
        
    test.ok(language.parser.group('type').parse(aStream).isPresent(), "accept [(int,string)] type");
    test.done();
  },    
};