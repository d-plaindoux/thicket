
'use strict';

var stream = require('../../lib' + (process.env.MOVICO_COV || '') + '/Parser/stream.js').stream,
    language = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/language.js').language(),
    ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/ast.js').ast;

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

exports['language_class'] = {
  setUp: function(done) {
    done();
  },
    
  'simple model is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("class Address this: Address {} {} ");
        
    test.ok(language.parser.group('controllerDef').parse(aStream).isPresent(), 
            "accept a controller");
    test.done();
  },
        
  'not well formed model is rejected': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("controller Address this {} {} ");
        
    test.equal(language.parser.group('controllerDef').parse(aStream).isPresent(), 
               false , "reject a controller");
    test.done();
  },
        
  'simple controller is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("class Address this:Address {} {}");
        
    test.deepEqual(language.parser.group('controllerDef').parse(aStream).get(), 
                   ast.controller('Address', [], ast.param('this',ast.type.variable('Address')), [], []) , 
                   "accept a controller");
    test.done();
  },
        
  'simple controller with generics is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("class Address [a b] this:Address {}{}");
        
    test.deepEqual(language.parser.group('controllerDef').parse(aStream).get(), 
                   ast.controller('Address', ["a", "b"], ast.param('this',ast.type.variable('Address')), [], []) , 
                   "accept a controller");
    test.done();
  },
        
  'controller with a constant behavior is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("class Address this:Address { number : number } { def number = 123 }");        
    test.deepEqual(language.parser.group('controllerDef').parse(aStream).get(), 
                   ast.controller('Address',
                                  [],
                                  ast.param('this',ast.type.variable('Address')), 
                                  [ ast.param('number', ast.type.variable("number")) ],
                                  [ ast.method('number', ast.expr.number(123)) ]) , 
                   "accept a controller");
    test.done();
  },
        
  'controller with a functional behavior is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("class Address this: Address { number : unit -> number } { def number _ = 123 }");        
    test.deepEqual(language.parser.group('controllerDef').parse(aStream).get(), 
                   ast.controller('Address', 
                                  [],
                                  ast.param('this', ast.type.variable('Address')), 
                                  [ ast.param('number', ast.type.abstraction(ast.type.variable("unit"), ast.type.variable("number"))) ], 
                                  [ ast.method('number', ast.expr.abstraction("_", ast.expr.number(123))) ]), 
                   "accept a controller");
    test.done();
  },
        
  'controller with a generic functional behavior is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("class Address this: Address { number : [a] a -> a } { def number x = x }");        
    test.deepEqual(language.parser.group('controllerDef').parse(aStream).get(), 
                   ast.controller('Address',
                                  [],
                                  ast.param('this', ast.type.variable('Address')), 
                                  [ ast.param('number', ast.type.forall(["a"],ast.type.abstraction(ast.type.variable("a"),ast.type.variable("a")))) ],
                                  [ ast.method('number', ast.expr.abstraction("x", ast.expr.ident("x")))]) , 
                   "accept a controller");
    test.done();
  },
        
  'controller with a method and specific caller': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("class Address this: Address { number : [a] a -> a } { def (a).number x = x }");        
    test.deepEqual(language.parser.group('controllerDef').parse(aStream).get(), 
                   ast.controller('Address',
                                  [],
                                  ast.param('this', ast.type.variable('Address')), 
                                  [ ast.param('number', ast.type.forall(["a"],ast.type.abstraction(ast.type.variable("a"),ast.type.variable("a")))) ],
                                  [ ast.method('number', ast.expr.abstraction("x", ast.expr.ident("x")), ast.type.variable("a")) ]) , 
                   "accept a controller");
    test.done();
  },

};