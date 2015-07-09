'use strict';

var stream = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/stream.js'),
    language = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/syntax/language.js')(),
    ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/syntax/ast.js');

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

exports['language_object'] = {
  setUp: function(done) {
    done();
  },
    
  'simple model is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("model Address {}");
        
    test.ok(language.parser.group('modelDef').parse(aStream).isPresent(), 
            "accept a model");
    test.done();
  },
        
  'not well formed model is rejected': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("model Address { address } ");
        
    test.equal(language.parser.group('modelDef').parse(aStream).isPresent(), 
               false ,
               "reject a model");
    test.done();
  },
        
  'simple model is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("model Address {}");
        
    test.deepEqual(language.parser.group('modelDef').parse(aStream).get().definition, 
                   ast.model('Address', [], []) , 
                   "accept a model");
    test.done();
  },
        
  'simple model with generics is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("model Address [a b] {}");
        
    test.deepEqual(language.parser.group('modelDef').parse(aStream).get().definition, 
                   ast.type.forall(["a","b"], ast.model('Address', [ast.type.variable('a'),ast.type.variable('b')], [])) , 
                   "accept a model");
    test.done();
  },
        
  'complexe model is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("model Address { street : string number : number}");        
    test.deepEqual(language.parser.group('modelDef').parse(aStream).get().definition, 
                   ast.model('Address', 
                             [],
                             [ast.param('street',ast.type.variable('string')), ast.param('number',ast.type.variable('number'))]) , 
                   "accept a model");
    test.done();
  },
        
  'complexe polymorphic model is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("model Address { street : string number : [a] a }");        
    test.deepEqual(language.parser.group('modelDef').parse(aStream).get().definition, 
                   ast.model('Address', 
                             [],
                             [ast.param('street',ast.type.variable('string')), ast.param('number',ast.type.forall(["a"],ast.type.variable("a")))]) , 
                   "accept a model");
    test.done();
  },
        
  'complexe type model set': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("type Location { model Address {} }");     
    test.deepEqual(language.parser.group('sortDef').parse(aStream).get().map(function(m) { return m.definition; }), 
                   [ ast.model('Address', [],[], ast.model('Location', [],[], undefined, true)), ast.model('Location', [],[], undefined, true) ], 
                   "accept a type of models");
    test.done();
  },
        
  'type definitin set': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("typedef Id = [a] a -> a");     
    test.deepEqual(language.parser.group('typeDef').parse(aStream).get().definition, 
                   ast.typedef("Id",[],ast.type.forall(["a"], ast.type.abstraction(ast.type.variable("a"), ast.type.variable("a")))), 
                   "accept a type definition");
    test.done();
  },

};