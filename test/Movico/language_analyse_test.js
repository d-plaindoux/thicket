'use strict';

var stream = require('../../lib' + (process.env.MOVICO_COV || '') + '/Parser/stream.js').stream,
    aTry = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/atry.js').atry,
    list = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/list.js').list,
    pair = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/pair.js').pair,
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
            nongenerics = list(allEntities.orElse([])).map(function (entity) {
                return entity.name;
            }),
            variables = list(allEntities.orElse([])).map(function (entity) {
                return pair(entity.name, entity);
            });

        if (!aStream.isEmpty()) {
            console.log("\n<ERROR LOCATION> " + aStream.location());
        }
                        
        test.ok(allEntities.isPresent(), "accept a full example");
        test.ok(aStream.isEmpty(), "accept a full example");        
        test.ok(list(allEntities.orElse([])).foldL(list(), function (result, entity) {
                    return result.append(entities.freeVariables(entity));
                }).minus(nongenerics).isEmpty(),
                "No free variables");

        test.ok(list(allEntities.orElse([])).foldL(aTry.success(null), function (result, entity) {
                    return result.flatmap(function () {
                        return entities.analyse(variables, entity);
                    });
                }).isSuccess(),
                "Type ");

        test.done();                
    });    
}

exports['language'] = {
  setUp: function(done) {
    done();
  },
/*
  'entity 01': function(test) {
    correctSampleTest("model_01.mvc", test);    
  },
*/
  'entity 02': function(test) {
    correctSampleTest("model_02.mvc", test);    
  },
};