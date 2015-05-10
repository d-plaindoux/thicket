/*jshint -W061 */

'use strict';

var thicketc = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/thicketc.js'),
    codegen = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/generator/code.js'),    
    native = require('../../lib' + (process.env.THICKET_COV || '') + '/Runtime/native.js'),
    M = native(require('../../lib' + (process.env.THICKET_COV || '') + '/Runtime/runtime.js'));

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
    var expression = thicketc.sentence([], "123"),
        code = codegen.executable(codegen.sentence([], expression.get().success().expr).success());
        
    test.deepEqual(M.$$(eval(code)(M)), M.$$(M.number(123)));
    test.done();
  },
    
  'String': function(test) {
    test.expect(1);
    // tests here  
    var expression = thicketc.sentence([], "'123'"),
        code = codegen.executable(codegen.sentence([], expression.get().success().expr).success());
        
    test.deepEqual(M.$$(eval(code)(M)), M.$$(M.string("123")));
    test.done();
  },
    
  'Unit': function(test) {
    test.expect(1);
    // tests here  
    var expression = thicketc.sentence([], "()"),
        code = codegen.executable(codegen.sentence([], expression.get().success().expr).success());
        
    test.deepEqual(M.$$(eval(code)(M)), M.$$(M.unit));
    test.done();
  },
    
  'Identity function': function(test) {
    test.expect(1);
    // tests here  
    var expression = thicketc.sentence([], "(f -> f) 1"),
        code = codegen.executable(codegen.sentence([], expression.get().success().expr).success());
        
    test.deepEqual(M.$$(eval(code)(M)), M.$$(M.number(1)));
    test.done();
  },
    
  'Left projection function': function(test) {
    test.expect(1);
    // tests here  
    var expression = thicketc.sentence([], "(x y -> x) 1 2"),
        code = codegen.executable(codegen.sentence([], expression.get().success().expr).success());
        
    test.deepEqual(M.$$(eval(code)(M)), M.$$(M.number(1)));
    test.done();
  },
    
  'Right projection function': function(test) {
    test.expect(1);
    // tests here  
    var expression = thicketc.sentence([], "(x y -> y) 1 2"),
        code = codegen.executable(codegen.sentence([], expression.get().success().expr).success());
        
    test.deepEqual(M.$$(eval(code)(M)), M.$$(M.number(2)));
    test.done();
  },    
/*   
  'Simple model attribute': function(test) {
    test.expect(1);
    // tests here  
    var entities = thicketc.entities([], "model E { _ : number }"),
        expression = thicketc.sentence(entities.success().map(function(entity){
            return entity.entity;
        }),"(E 1) _");
          
    entities.success().map(function(entity) {
        eval(entity.code(M));
    });
      
    test.deepEqual(M.$$(eval(expression.success().code)), M.$$(M.number(1)));      
    test.done();
  }, 
*/
};
