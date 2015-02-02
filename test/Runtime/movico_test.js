'use strict';

var stream = require('../../lib' + (process.env.MOVICO_COV || '') + '/Parser/stream.js').stream,
    list = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/list.js').list,    
    language = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/language.js').language(),
    compiler = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/compiler.js').compiler,
    M = require('../../lib' + (process.env.MOVICO_COV || '') + '/Runtime/movico.js').M;

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

exports['runtime'] = {
  setUp: function(done) {
    done();
  },
    
  'Number': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("123"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.expression(list(),list(),expression).success();
        
    test.deepEqual(M.$$(eval(source)), 123);
    test.done();
  },
    
  'String': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("'123'"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.expression(list(),list(),expression).success();
        
    test.deepEqual(M.$$(eval(source)), '123');
    test.done();
  },
    
  'Unit': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("()"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.expression(list(),list(),expression).success();
        
    test.deepEqual(M.$$(eval(source)), null);
    test.done();
  },
    
  'Identity function': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(fun f -> f) 1"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.expression(list(),list(),expression).success();
        
    test.deepEqual(M.$$(eval(source)), 1);
    test.done();
  },
    
  'Left projection function': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(fun x y -> x) 1 2"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.expression(list(),list(),expression).success();
        
    test.deepEqual(M.$$(eval(source)), 1);
    test.done();
  },
    
  'Right projection function': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(fun x y -> y) 1 2"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.expression(list(),list(),expression).success();
        
    test.deepEqual(M.$$(eval(source)), 2);
    test.done();
  },
    
  'Simple model': function(test) {
    test.expect(1);
    // tests here  
    var model = compiler.model(language.parser.group('modelDef').parse(stream("model E { _ : number }")).get()).success(),
        expression = language.parser.group('exprs').parse(stream("(E 1) _")).get(),
        source = compiler.expression(list(),list(),expression).success();
      
    eval(model); // define the model
      
    test.deepEqual(M.$$(eval(source)), 1);
    test.done();
  },
};
