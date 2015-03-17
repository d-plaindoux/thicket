'use strict';

var stream = require('../../lib' + (process.env.MOVICO_COV || '') + '/Parser/stream.js'),
    language = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/syntax/language.js')(),
    ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/syntax/ast.js');

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

exports['language_definition '] = {
  setUp: function(done) {
    done();
  },
    
  'simple expression definition': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("def un : number = 1");
        
    test.deepEqual(language.parser.group('expressionDef').parse(aStream).get(),
                   ast.expression("un",ast.type.variable("number"), ast.expr.number(1)), "accept a definition");
    test.done();
  },
};