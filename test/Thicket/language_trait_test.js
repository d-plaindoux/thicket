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

exports['language_trait'] = {
  setUp: function(done) {
    done();
  },
    
  'simple model is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("trait Address {} {} ");
        
    test.ok(language.parser.group('traitDef').parse(aStream).isPresent(), 
            "accept a trait");
    test.done();
  },
        
  'simple trait is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("trait Address {} {}");
        
    test.deepEqual(language.parser.group('traitDef').parse(aStream).get().definition, 
                   ast.trait('Address', [], [], []) , 
                   "accept a trait");
    test.done();
  },
        
  'simple trait with generics is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("trait Address [a b] {}{}");
        
    test.deepEqual(language.parser.group('traitDef').parse(aStream).get().definition, 
                   ast.type.forall(["a", "b"], 
                                   ast.specialization(ast.trait('Address', [ast.type.variable('a'),ast.type.variable('b')], [], []),
                                                     [ast.type.variable('a'),ast.type.variable('b')])) , 
                   "accept a trait");
    test.done();
  },
        
  'trait with a constant behavior is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("trait Address { number : number } { def number = 123 }");        
    test.deepEqual(language.parser.group('traitDef').parse(aStream).get().definition, 
                   ast.trait('Address',
                             [],
                             [ ast.param('number', ast.type.variable("number")) ],
                             [ ast.method('number', ast.expr.number(123)) ]) , 
                   "accept a trait");
    test.done();
  },
        
  'trait with a functional behavior is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("trait Address { number : unit -> number } { def number _ = 123 }");        
    test.deepEqual(language.parser.group('traitDef').parse(aStream).get().definition, 
                   ast.trait('Address', 
                             [],
                             [ ast.param('number', ast.type.abstraction(ast.type.variable("unit"), ast.type.variable("number"))) ], 
                             [ ast.method('number', ast.expr.abstraction("_", ast.expr.number(123))) ]), 
                   "accept a trait");
    test.done();
  },
        
  'trait with a functional typed behavior is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("trait Address { number : unit -> number } { def number _ = 123 }");        
    test.deepEqual(language.parser.group('traitDef').parse(aStream).get().definition, 
                   ast.trait('Address', 
                             [],
                             [ ast.param('number', ast.type.abstraction(ast.type.variable("unit"), ast.type.variable("number"))) ], 
                             [ ast.method('number', ast.expr.abstraction("_", ast.expr.number(123))) ]), 
                   "accept a trait");
    test.done();
  },
        
  'trait with a generic functional behavior is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("trait Address { number : [a] a -> a } { def number x = x }");        
    test.deepEqual(language.parser.group('traitDef').parse(aStream).get().definition, 
                   ast.trait('Address',
                             [],
                             [ ast.param('number', ast.type.forall(["a"],ast.type.abstraction(ast.type.variable("a"),ast.type.variable("a")))) ],
                             [ ast.method('number', ast.expr.abstraction("x", ast.expr.ident("x")))]) , 
                   "accept a trait");
    test.done();
  },
        
  'trait with a method and specific caller': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("trait Address { number : [a] a -> a } { def a.number x = x }");        
    test.equal(language.parser.group('traitDef').parse(aStream).isPresent(), 
               false,
               "reject a trait");
    test.done();
  },
       
  'trait with a infix method and specific caller': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("trait Address { (+) : [a] a -> a } { def (+) x = x }");        
    test.deepEqual(language.parser.group('traitDef').parse(aStream).get().definition, 
                   ast.trait('Address',
                             [],
                             [ ast.param('+', ast.type.forall(["a"],ast.type.abstraction(ast.type.variable("a"),ast.type.variable("a")))) ],
                             [ ast.method('+', ast.expr.abstraction("x", ast.expr.ident("x"))) ]) , 
                   "accept a trait");
    test.done();
  },
       
  'trait with derivation': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("trait Address { with CityLocation } { }");        
    test.deepEqual(language.parser.group('traitDef').parse(aStream).get().definition, 
                   ast.trait('Address',
                             [],
                             [ ],
                             [ ],
                             [ ast.type.variable('CityLocation') ]) , 
                   "accept a trait");
    test.done();
  },

};