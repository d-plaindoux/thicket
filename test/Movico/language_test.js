'use strict';

var stream = require('../../lib' + (process.env.MOVICO_COV || '') + '/Parser/stream.js').stream,
    language = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/language.js').language(),
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
        if (err) {
            throw err;
        }
        
        var aStream = stream(data.toString()),
            entities = language.parser.group('entities').parse(aStream);

        if (!aStream.isEmpty()) {
            console.log("\n<ERROR LOCATION> " + aStream.location());
        }
                
        var max = language.parser.groups["entities"].totalTime;
        
        console.log();
        console.log("Profiling -----------");
        
        for (var name in language.parser.groups) {
            var current = language.parser.groups[name].totalTime;
            console.log("Profiling GROUP " + name + " consumes " + current + " ms / " + Math.floor(current * 100 / max) + "%");
        }
                
        console.log("Profiling SKIPPED consumes " + language.parser.skipped.totalTime + " ms / " + Math.floor(language.parser.skipped.totalTime * 100 / max) + "%");
        console.log("Profiling -----------");
        
        test.ok(entities.isPresent(), "accept a full example");
        test.ok(aStream.isEmpty(), "accept a full example");
        test.done();                
    });
        
  },

};