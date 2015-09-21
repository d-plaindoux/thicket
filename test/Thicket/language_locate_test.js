'use strict';

var stream = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/stream.js'),
    language = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/language.js')().locate();

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
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['language_locate'] = {
  setUp: function(done) {
    done();
  },
    
  'simple expression definition': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("def un : number = 1");
        
    test.deepEqual(language.parser.group('expressionDef').parse(aStream).get().definition,
                   { '$t': 'Expression',
                      name: 'un',
                      type: 
                       { '$t': 'TypeVariable',
                         name: 'number',
                         '$location': { filename: undefined, offset: 16, line: 1, character: 17 } },
                      expr: 
                        { '$t': 'ApplicationExpr',
                                abstraction: 
                                 { '$t': 'IdentExpr',
                                   value: 'number',
                                   '$location': { filename: undefined, offset: 18, line: 1, character: 19 } },
                                argument: 
                                 { '$t': 'NativeExpr',
                                   value: 1,
                                   '$location': { filename: undefined, offset: 18, line: 1, character: 19 } },
                                '$location': { filename: undefined, offset: 18, line: 1, character: 19 } },
                             '$location': { filename: undefined, offset: 0, line: 1, character: 1 } },
                   "accept a definition");
    test.done();
  },
    
  'Function expression definition': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("def idNumber : number -> number = s -> s");
        
    test.deepEqual(language.parser.group('expressionDef').parse(aStream).get().definition,
                   { '$t': 'Expression',
                      name: 'idNumber',
                      type: 
                       { '$t': 'TypeFunction',
                         argument: 
                          { '$t': 'TypeVariable',
                            name: 'number',
                            '$location': { filename: undefined, offset: 22, line: 1, character: 23 } },
                         result: 
                          { '$t': 'TypeVariable',
                            name: 'number',
                            '$location': { filename: undefined, offset: 32, line: 1, character: 33 } },
                         '$location': { filename: undefined, offset: 22, line: 1, character: 23 } },
                      expr: 
                       { '$t': 'AbstractionExpr',
                         param: 's',
                         type: undefined,
                         body: 
                          { '$t': 'IdentExpr',
                            value: 's',
                            '$location': { filename: undefined, offset: 40, line: 1, character: 41 } },
                         '$location': { filename: undefined, offset: 34, line: 1, character: 35 } },
                      '$location': { filename: undefined, offset: 0, line: 1, character: 1 } }, 
                   "accept a definition");
    test.done();
  },
};