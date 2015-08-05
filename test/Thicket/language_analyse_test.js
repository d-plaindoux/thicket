'use strict';

var fs = require('fs'),
    stream = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/stream.js'),
    language = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/language.js')(),
    entities = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/checker/entities.js'),
    option = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/option.js'),
    packages = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/packages.js'),
    linker = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/linker.js'),
    environment = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/environment.js');


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
    test.expect(4);
    // tests here  
    fs.readFile('./test/Thicket/samples/' + sample, function (err,data) {
        if (err) {
            throw err;
        }
                
        var aStream = stream(data.toString()),
            entitiesAndSentencies = language.parser.group('entities').parse(aStream),
            aPackages = packages(option.none());                    

        if (!aStream.isEmpty()) {
            console.log("\n<ERROR LOCATION> " + aStream.location());
        }
                        
        test.ok(entitiesAndSentencies.isPresent(), "accept a full example");
        test.ok(aStream.isEmpty(), "accept a full example");        
    
        var allEntities = entitiesAndSentencies.orElse([[]])[0];
        
        aPackages.defineInRoot([],allEntities);
        
        test.ok(linker(aPackages).linkPackageByName(aPackages.main()).isSuccess(), "Linker");             
        test.ok(checker(entities.analyse(environment(aPackages), allEntities)), "Type");

        test.done();                
    });    
}

function correctSampleTest(sample, test) {
    return sampleTest(sample, test, function (r) { return r.isSuccess(); });
}

function wrongSampleTest(sample, test) {
    return sampleTest(sample, test, function (r) { return r.isFailure(); });
}

exports['language_analyse'] = {
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

  'test 04': function(test) {
    correctSampleTest("04.tkt", test);    
  },

  'test 05': function(test) {
    correctSampleTest("05.tkt", test);    
  },
    
  'test 06': function(test) {
    correctSampleTest("06.tkt", test);    
  },
   
  'test 07': function(test) {
    correctSampleTest("07.tkt", test);    
  },
   
  'test 08': function(test) {
    correctSampleTest("08.tkt", test);    
  },
   
  'test 09': function(test) {
    correctSampleTest("09.tkt", test);    
  },
   
  'test 10': function(test) {
    correctSampleTest("10.tkt", test);    
  },
   
  'test 11': function(test) {
    correctSampleTest("11.tkt", test);    
  },
   
  'test 12': function(test) {
    correctSampleTest("12.tkt", test);    
  },

  'test 13': function(test) {
    wrongSampleTest("13.tkt", test);    
  },
 
  'test 14': function(test) {
    wrongSampleTest("14.tkt", test);    
  },

  'test 15': function(test) {
    correctSampleTest("15.tkt", test);    
  },

  'test 16': function(test) {
    wrongSampleTest("16.tkt", test);    
  },

  'test 17': function(test) {
    correctSampleTest("17.tkt", test);    
  },

  'test 18': function(test) {
    correctSampleTest("18.tkt", test);    
  },

  'test 19': function(test) {
    correctSampleTest("19.tkt", test);    
  },

  'test 20': function(test) {
    wrongSampleTest("20.tkt", test);    
  },

  'test 21': function(test) {
    wrongSampleTest("21.tkt", test);    
  },

  'test 22': function(test) {
    correctSampleTest("22.tkt", test);    
  },
};