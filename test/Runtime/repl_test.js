/*jshint -W061 */

'use strict';

var movicoc = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/movicoc.js'),
    native = require('../../lib' + (process.env.MOVICO_COV || '') + '/Runtime/native.js'),
    M = native(require('../../lib' + (process.env.MOVICO_COV || '') + '/Runtime/runtime.js'));

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
    var expression = movicoc.sentence([], "123");
        
    test.deepEqual(M.$$(eval(expression.success().code)), M.$$(M.number(123)));
    test.done();
  },
    
  'String': function(test) {
    test.expect(1);
    // tests here  
    var expression = movicoc.sentence([], "'123'");
        
    test.deepEqual(M.$$(eval(expression.success().code)), M.$$(M.string("123")));
    test.done();
  },
    
  'Unit': function(test) {
    test.expect(1);
    // tests here  
    var expression = movicoc.sentence([], "()");
        
    test.deepEqual(M.$$(eval(expression.success().code)), M.$$(M.unit));
    test.done();
  },
    
  'Identity function': function(test) {
    test.expect(1);
    // tests here  
    var expression = movicoc.sentence([], "(fun f -> f) 1");
        
    test.deepEqual(M.$$(eval(expression.success().code)), M.$$(M.number(1)));
    test.done();
  },
    
  'Left projection function': function(test) {
    test.expect(1);
    // tests here  
    var expression = movicoc.sentence([], "(fun x y -> x) 1 2");
        
    test.deepEqual(M.$$(eval(expression.success().code)), M.$$(M.number(1)));
    test.done();
  },
    
  'Right projection function': function(test) {
    test.expect(1);
    // tests here  
    var expression = movicoc.sentence([], "(fun x y -> y) 1 2");
        
    test.deepEqual(M.$$(eval(expression.success().code)), M.$$(M.number(2)));
    test.done();
  },    
/*   
  'Simple model attribute': function(test) {
    test.expect(1);
    // tests here  
    var entities = movicoc.entities([], "model E { _ : number }"),
        expression = movicoc.sentence(entities.success().map(function(entity){
            return entity.entity;
        }),"(E 1) _");
          
    entities.success().map(function(entity) {
        eval(entity.code);
    });
      
    test.deepEqual(M.$$(eval(expression.success().code)), M.$$(M.number(1)));      
    test.done();
  },
*/    
};
