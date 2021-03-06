'use strict';

var stream = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/stream.js'),
    language = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/language.js')(),
    ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/ast.js');

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

exports['language_params'] = {
  setUp: function(done) {
    done();
  },
    
  'simple typed param is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("age : number");
        
    test.ok(language.parser.group('param').parse(aStream).isPresent(), 
            "accept number type");
    test.done();
  },
    
  'simple typed param is accepted and ast params is correct': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("age : number");
        
    test.deepEqual(language.parser.group('param').parse(aStream).get(), 
                   ast.param('age', ast.type.variable('number')),  "provide a param");
    test.done();
  },

  'simple untyped param is rejected and ast params is empty': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("age : ");
        
    test.equal(language.parser.group('param').parse(aStream).isPresent(),
              false,  "reject when no param");
    test.done();
  },

};