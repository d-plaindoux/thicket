'use strict';

var stream = require('../../lib/Parser/stream.js').stream,
    language = require('../../lib/Movico/language.js').language,
    ast = require('../../lib/Movico/ast.js').ast,
    fs = require('fs');

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
    test.(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['language'] = {
  setUp: function(done) {
    done();
  },
    
  'entities are accepted': function(test) {
    test.expect(2);
    // tests here  
    fs.readFile('./test/Movico/test.mvc', function (err,data) {
        if (err) throw err;
        
        var aStream = stream(data.toString()),
            entities = language.parser.group('entities').parse(aStream);
        
        test.ok(entities.isPresent(), "accept a full example");
        test.ok(aStream.isEmpty(), "accept a full example");
        test.done();        
    });
        
  },

};