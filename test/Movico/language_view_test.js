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

exports['language_view '] = {
  setUp: function(done) {
    done();
  },
    
  'simple view is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("view Address this: Address { } ");
        
    test.deepEqual(language.parser.group('viewDef').parse(aStream).get(),
                   ast.view('Address', [], ast.param('this', ast.type.variable('Address')), []), "accept a view");
    test.done();
  },
    
  'simple view with generics is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("view Address [a b] this: Address { } ");
        
    test.deepEqual(language.parser.group('viewDef').parse(aStream).get(),
                   ast.type.forall(["a","b"], ast.view('Address', [ast.type.variable('a'),ast.type.variable('b')], ast.param('this', ast.type.variable('Address')), []), "accept a view"));
    test.done();
  },

  'complex view is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("view Address this: Address { <div onClick=(this.tick ())> <div>this.firstname</div> <div>this.name</div> <div>this.age</div> </div>}");
        
    test.ok(language.parser.group('viewDef').parse(aStream).isPresent(), 
            "accept a view");
    test.done();
  },    
};