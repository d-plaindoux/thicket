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
            // allSentences = entitiesAndSentencies.orElse([[],[]])[1];
        
        aPackages.defineInRoot([],allEntities);
        
        test.ok(linker(aPackages).linkPackageByName(aPackages.main()).isSuccess(), "Linker");             
        test.ok(checker(entities.analyse(environment(aPackages), allEntities)), "Definitions");
        // must be reviewed -- test.ok(checker(entities.analyse(environment(aPackages), allSentences)), "Sentences");

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
    wrongSampleTest("18.tkt", test);    
  },

  'test 19': function(test) {
    wrongSampleTest("19.tkt", test);    
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

  'test 23': function(test) {
    correctSampleTest("23.tkt", test);    
  },

  'test 24': function(test) {
    correctSampleTest("24.tkt", test);    
  },

  'test 25': function(test) {
    wrongSampleTest("25.tkt", test);    
  },

  'test 26': function(test) {
    correctSampleTest("26.tkt", test);    
  },

  'test 27': function(test) {
    correctSampleTest("27.tkt", test);    
  },

  'test 28': function(test) {
    wrongSampleTest("28.tkt", test);    
  },

  'test 29': function(test) {
    correctSampleTest("29.tkt", test);    
  },

  'test 30': function(test) {
    correctSampleTest("30.tkt", test);    
  },

  'test 31': function(test) {
    wrongSampleTest("31.tkt", test);    
  },

  'test 32': function(test) {
    wrongSampleTest("32.tkt", test);    
  },

  'test 33': function(test) {
    correctSampleTest("33.tkt", test);    
  },
    
  'test 34': function(test) {
    wrongSampleTest("34.tkt", test);    
  },
    
  'test 35': function(test) {
    wrongSampleTest("35.tkt", test);    
  },

  'test 36': function(test) {
    correctSampleTest("36.tkt", test);    
  },

  'test 37': function(test) {
    wrongSampleTest("37.tkt", test);    
  },

  'test 38': function(test) {
    correctSampleTest("38.tkt", test);    
  },

  'test 39': function(test) {
    wrongSampleTest("39.tkt", test);    
  },

  'test 40': function(test) {
    wrongSampleTest("40.tkt", test);    
  },

  'test 41': function(test) {
    wrongSampleTest("41.tkt", test);    
  },

  'test 42': function(test) {
    correctSampleTest("42.tkt", test);    
  },

  'test 43': function(test) {
    correctSampleTest("43.tkt", test);    
  },

  'test 44': function(test) {
    correctSampleTest("44.tkt", test);    
  }
};