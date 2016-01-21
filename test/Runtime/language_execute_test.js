'use strict';

var fs = require('fs'),
    option = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/option.js'),    
    toplevel = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/frontend/toplevel.js');


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

function sampleTest(sample, test, checker) {
    test.expect(1);
    // tests here                      

    
    fs.readFile('./test/Runtime/samples/' + sample, function (err,data) {
        if (err) {            
            throw err;
        }

        var source = data.toString(),
            reader = option.none(),
            aToplevel = toplevel(reader, false).setLogAgent(function(){});
        
        var result = aToplevel.manageSourceCode(source);

        test.ok(checker(result), "Compilation & Execution");        
    
        test.done();  
    });                  
}

function correctSampleTest(sample, test) {
    return sampleTest(sample, test, function (r) { return r.isSuccess(); });
}
/*
function wrongSampleTest(sample, test) {
    return sampleTest(sample, test, function (r) { return r.isFailure(); });
}
*/
exports['language_execute'] = {
  setUp: function(done) {
    done();
  },

  'test 01': function(test) {
    correctSampleTest("01.tkt", test);    
  },

  'test 02': function(test) {
    correctSampleTest("02.tkt", test);    
  },

  'test 03': function(test) {
    correctSampleTest("03.tkt", test);    
  },
};