'use strict';

var stream = require('../../lib' + (process.env.MOVICO_COV || '') + '/Parser/stream.js'),
    list = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/list.js'),
    language = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/syntax/language.js')(),
    entities = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/checker/entities.js'),
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

function sampleTest(sample, test, checker) {
    test.expect(4);
    // tests here  
    fs.readFile('./test/Movico/samples/' + sample, function (err,data) {
        if (err) {
            throw err;
        }
                
        var aStream = stream(data.toString()),
            allEntities = language.parser.group('entities').parse(aStream),
            nongenerics = entities.nongenerics(allEntities),            
            nongenericModels = entities.nongenericModels(allEntities),            
            specifications = entities.specifications(allEntities),
            models = entities.models(allEntities),
            environment = entities.environment(allEntities);

        if (!aStream.isEmpty()) {
            console.log("\n<ERROR LOCATION> " + aStream.location());
        }
                        
        test.ok(allEntities.isPresent(), "accept a full example");
        test.ok(aStream.isEmpty(), "accept a full example");        
        test.ok(list(allEntities.orElse([])).foldL(list(), function (result, entity) {
                    return result.append(entities.freeVariables(nongenericModels, entity));
                }).minus(nongenerics).isEmpty(),
                "No free variables");

        var analyse = entities.analyse(nongenerics, environment, models,  specifications, allEntities.orElse([]));
        
        test.ok(checker(analyse), "Type");

        test.done();                
    });    
}


function correctSampleTest(sample, test) {
    return sampleTest(sample, test, function (r) { return r.isSuccess(); });
}

function wrongSampleTest(sample, test) {
    return sampleTest(sample, test, function (r) { return r.isFailure(); });
}

exports['language'] = {
  setUp: function(done) {
    done();
  },

  'entity 01': function(test) {
    correctSampleTest("model_01.mvc", test);    
  },

  'entity 02': function(test) {
    correctSampleTest("model_02.mvc", test);    
  },

  'entity 03': function(test) {
    correctSampleTest("model_03.mvc", test);    
  },

  'entity 04': function(test) {
    correctSampleTest("model_04.mvc", test);    
  },

  'entity 05': function(test) {
    correctSampleTest("model_05.mvc", test);    
  },
    
  'entity 06': function(test) {
    correctSampleTest("model_06.mvc", test);    
  },
   
  'entity 07': function(test) {
    correctSampleTest("model_07.mvc", test);    
  },
   
  'entity 08': function(test) {
    correctSampleTest("model_08.mvc", test);    
  },
   
  'entity 09': function(test) {
    correctSampleTest("model_09.mvc", test);    
  },
   
  'entity 10': function(test) {
    correctSampleTest("model_10.mvc", test);    
  },
   
  'entity 11': function(test) {
    correctSampleTest("model_11.mvc", test);    
  },
   
  'entity 12': function(test) {
    correctSampleTest("model_12.mvc", test);    
  },

  'entity 13': function(test) {
    wrongSampleTest("model_13.mvc", test);    
  },

  'entity 14': function(test) {
    wrongSampleTest("model_14.mvc", test);    
  },};