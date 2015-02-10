/*jshint -W061 */

'use strict';

var movicoc = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/movicoc.js').movicoc,
    predefine = require('../../lib' + (process.env.MOVICO_COV || '') + '/Runtime/predefine.js').predefine,
    M = predefine(require('../../lib' + (process.env.MOVICO_COV || '') + '/Runtime/movico.js').M);

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

exports['repl'] = {
  setUp: function(done) {
    done();
  },
    
  'Number': function(test) {
    test.expect(1);
    // tests here  
    var expression = movicoc.sentence([], "123")
        
    test.deepEqual(M.$$(eval(expression.success().expression)), M.$$(M.number(123)));
    test.done();
  },
    
  'String': function(test) {
    test.expect(1);
    // tests here  
    var expression = movicoc.sentence([], "'123'")
        
    test.deepEqual(M.$$(eval(expression.success().expression)), M.$$(M.string("123")));
    test.done();
  },
    
  'Unit': function(test) {
    test.expect(1);
    // tests here  
    var expression = movicoc.sentence([], "()")
        
    test.deepEqual(M.$$(eval(expression.success().expression)), M.$$(M.unit));
    test.done();
  },
};
