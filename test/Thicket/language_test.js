'use strict';

var stream = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/stream.js'),
    language = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/syntax/language.js')(),
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
    fs.readFile('./test/Thicket/samples/language_test.tkt', function (err,data) {
        if (err) {
            throw err;
        }
        
        var aStream = stream(data.toString()),
            entities = language.parser.group('entities').parse(aStream);

        if (!aStream.isEmpty()) {
            console.log("\n<ERROR LOCATION> " + aStream.location());
        }

        test.ok(entities.isPresent(), "accept a full example");
        test.ok(aStream.isEmpty(), "accept a full example");
        test.done();                
    });
        
  },

};