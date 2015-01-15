'use strict';

var stream = require('../../lib' + (process.env.MOVICO_COV || '') + '/Parser/stream.js').stream,
    aTry = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/atry.js').atry,
    list = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/list.js').list,
    language = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/language.js').language(),
    entities = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/entities.js').entities,
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

function correctSampleTest(sample, test) {
    test.expect(4);
    // tests here  
    fs.readFile('./test/Movico/samples/' + sample, function (err,data) {
        if (err) {
            throw err;
        }
                
        var aStream = stream(data.toString()),
            allEntities = language.parser.group('entities').parse(aStream),
            nongenerics = entities.nongenerics(allEntities),            
            patternNongenerics = entities.patternNongenerics(allEntities),            
            substitutions = entities.substitutions(allEntities),
            patternSubstitutions = entities.patternSubstitutions(allEntities),
            environment = entities.environment(allEntities);

        if (!aStream.isEmpty()) {
            console.log("\n<ERROR LOCATION> " + aStream.location());
        }
                        
        test.ok(allEntities.isPresent(), "accept a full example");
        test.ok(aStream.isEmpty(), "accept a full example");        
        test.ok(list(allEntities.orElse([])).foldL(list(), function (result, entity) {
                    return result.append(entities.freeVariables(patternNongenerics, entity));
                }).minus(nongenerics).isEmpty(),
                "No free variables");

        var analyse = list(allEntities.orElse([])).foldL(aTry.success(null), function (result, entity) {
            return result.flatmap(function () {
                return entities.analyse(environment, substitutions, patternSubstitutions, entity);
            });
        });
        
        if (analyse.isFailure()) {
            console.log(analyse.failure().stack);
        }
        
        test.ok(analyse.isSuccess(), "Type ");

        test.done();                
    });    
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

};