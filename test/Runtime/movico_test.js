/*jshint -W061 */

'use strict';

var stream = require('../../lib' + (process.env.MOVICO_COV || '') + '/Parser/stream.js'),
    list = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/list.js'),    
    language = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/syntax/language.js')(),
    compiler = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/generator/code.js'),
    native = require('../../lib' + (process.env.MOVICO_COV || '') + '/Runtime/native.js'),
    runtime = native(require('../../lib' + (process.env.MOVICO_COV || '') + '/Runtime/runtime.js'));

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

function runtimeFun(code) {
    return "(function(){return function(runtime){"+code+"};}())";
}

exports['runtime'] = {
  setUp: function(done) {
    done();
  },
    
  'Number': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("123"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
        
    test.deepEqual(runtime.$$(eval(source)(runtime)), runtime.$$(runtime.number(123)));
    test.done();
  },
    
  'String': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("'123'"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
        
    test.deepEqual(runtime.$$(eval(source)(runtime)), runtime.$$(runtime.string('123')));
    test.done();
  },
    
  'Unit': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("()"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
        
    test.deepEqual(runtime.$$(eval(source)(runtime)), runtime.$$(runtime.unit));
    test.done();
  },
    
  'Identity function': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(f -> f) 1"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
        
    test.deepEqual(runtime.$$(eval(source)(runtime)), runtime.$$(runtime.number(1)));
    test.done();
  },
    
  'Left projection function': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(x y -> x) 1 2"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
        
    test.deepEqual(runtime.$$(eval(source)(runtime)), runtime.$$(runtime.number(1)));
    test.done();
  },
    
  'Right projection function': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(x y -> y) 1 2"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        source = compiler.sentence(list(),expression).success();
        
    test.deepEqual(runtime.$$(eval(source)(runtime)), runtime.$$(runtime.number(2)));
    test.done();
  },
    
  'Simple model attribute': function(test) {
    test.expect(1);
    // tests here  
    var modelSource = compiler.entity(list(), language.parser.group('modelDef').parse(stream("model E { _ : number }")).get()).success(),
        expression = language.parser.group('exprs').parse(stream("(E 1) _")).get(),
        source = compiler.sentence(list(),expression).success();
          
    runtime.$$(eval(runtimeFun(modelSource))(runtime)); 
      
    test.deepEqual(runtime.$$(eval(source)(runtime)), runtime.$$(runtime.number(1)));
    test.done();
  },
    
  'Simple generic model attribute': function(test) {
    test.expect(1);
    // tests here  
    var modelSource = compiler.entity(list(), language.parser.group('modelDef').parse(stream("model E[A] { _ : A }")).get()).success(),
        expression = language.parser.group('exprs').parse(stream("(E 1) _")).get(),
        source = compiler.sentence(list(),expression).success();
        
    eval(runtimeFun(modelSource))(runtime); 
      
    test.deepEqual(runtime.$$(eval(source)(runtime)), runtime.$$(runtime.number(1)));
    test.done();
  },
    
  'Simple model functional attribute': function(test) {
    test.expect(1);
    // tests here  
    var modelSource = compiler.entity(list(), language.parser.group('modelDef').parse(stream("model E { _ : number -> number }")).get()).success(),
        expression = language.parser.group('exprs').parse(stream("(E (e -> e)) _ 1")).get(),
        source = compiler.sentence(list(),expression).success();

    eval(runtimeFun(modelSource))(runtime); 
      
    test.deepEqual(runtime.$$(eval(source)(runtime)), runtime.$$(runtime.number(1)));
    test.done();
  },
    
  'Simple controller': function(test) {
    test.expect(1);
    // tests here  
    var modelSource = compiler.entity(list(), language.parser.group('controllerDef').parse(stream("class E this:number {}{ def unbox = this }")).get()).success(),
        expression = language.parser.group('exprs').parse(stream("E 1 unbox")).get(),
        source = compiler.sentence(list(),expression).success();

    eval(runtimeFun(modelSource))(runtime); 
      
    test.deepEqual(runtime.$$(eval(source)(runtime)), runtime.$$(runtime.number(1)));
    test.done();
  },
    
  'Simple controller calling self': function(test) {
    test.expect(1);
    // tests here  
    var modelSource = compiler.entity(list(), language.parser.group('controllerDef').parse(stream("class E this:number {}{ def unbox = this def new i = self i }")).get()).success(),
        expression = language.parser.group('exprs').parse(stream("E 1 new 2 unbox")).get(),
        source = compiler.sentence(list(),expression).success();

    eval(runtimeFun(modelSource))(runtime); 
      
    test.deepEqual(runtime.$$(eval(source)(runtime)), runtime.$$(runtime.number(2)));
    test.done();
  },
    
  'Simple controller filtered method': function(test) {
    test.expect(1);
    // tests here  
    var modelSource = compiler.entity(list(), language.parser.group('controllerDef').parse(stream("class E this:number {}{ def number.unbox = this}")).get()).success(),
        expression = language.parser.group('exprs').parse(stream("E 1 unbox")).get(),
        source = compiler.sentence(list(),expression).success();

    eval(runtimeFun(modelSource))(runtime); 
      
    test.deepEqual(runtime.$$(eval(source)(runtime)), runtime.$$(runtime.number(1)));
    test.done();
  },
    
  'Simple controller unfiltered method': function(test) {
    test.expect(1);
    // tests here  
    var modelSource = compiler.entity(list(), language.parser.group('controllerDef').parse(stream("class E this:number {}{ def string.unbox = this}")).get()).success(),
        expression = language.parser.group('exprs').parse(stream("E 1 unbox")).get(),
        source = compiler.sentence(list(),expression).success();

    eval(runtimeFun(modelSource))(runtime); 
      
    test.throws(function(){ runtime.$$(eval(source)(runtime)); });
    test.done();
  },
};
