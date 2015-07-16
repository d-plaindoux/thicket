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
        
        aPackages.defineInRoot(allEntities);
        
        test.ok(linker(aPackages).linkPackageByName('main').isSuccess(), "Linker");             
        test.ok(checker(entities.analyse(environment(aPackages), allEntities)), "Type");

        test.done();                
    });    
}


function correctSampleTest(sample, test) {
    return sampleTest(sample, test, function (r) { 
        if (r.isFailure()) {
            console.log(r.failure().stack);
        }
        return r.isSuccess(); 
    });
}

function wrongSampleTest(sample, test) {
    return sampleTest(sample, test, function (r) { return r.isFailure(); });
}

exports['language_analyse'] = {
  setUp: function(done) {
    done();
  },

  'entity 01': function(test) {
    correctSampleTest("model_01.tkt", test);    
  },

  'entity 02': function(test) {
    correctSampleTest("model_02.tkt", test);    
  },

  'entity 03': function(test) {
    correctSampleTest("model_03.tkt", test);    
  },

  'entity 04': function(test) {
    correctSampleTest("model_04.tkt", test);    
  },

  'entity 05': function(test) {
    correctSampleTest("model_05.tkt", test);    
  },
    
  'entity 06': function(test) {
    correctSampleTest("model_06.tkt", test);    
  },
   
  'entity 07': function(test) {
    correctSampleTest("model_07.tkt", test);    
  },
   
  'entity 08': function(test) {
    correctSampleTest("model_08.tkt", test);    
  },
   
  'entity 09': function(test) {
    correctSampleTest("model_09.tkt", test);    
  },
   
  'entity 10': function(test) {
    correctSampleTest("model_10.tkt", test);    
  },
   
  'entity 11': function(test) {
    correctSampleTest("model_11.tkt", test);    
  },
   
  'entity 12': function(test) {
    correctSampleTest("model_12.tkt", test);    
  },

  'entity 13': function(test) {
    wrongSampleTest("model_13.tkt", test);    
  },
 
  'entity 14': function(test) {
    wrongSampleTest("model_14.tkt", test);    
  },

  'entity 15': function(test) {
    correctSampleTest("model_15.tkt", test);    
  },

  'entity 16': function(test) {
    wrongSampleTest("model_16.tkt", test);    
  },

  'entity 17': function(test) {
    correctSampleTest("model_17.tkt", test);    
  },

};