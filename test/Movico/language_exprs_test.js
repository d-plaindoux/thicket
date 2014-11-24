'use strict';

var stream = require('../../src/Analyser/stream.js').stream,
    language = require('../../src/Movico/language.js').language,
    ast = require('../../src/Movico/ast.js').ast;

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

exports['language_exprs'] = {
  setUp: function(done) {
    done();
  },
    
  'number expression is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("123");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
               ast.number(123), "accept a number");
    test.done();
  },
    
  'string expression is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('"123"');
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
               ast.string("123"), "accept a string");
    test.done();
  },
    
  'string expression with dquote is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('"12\"3"');
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
               ast.string("12\"3"), "accept a string");
    test.done();
  },

  'simple string expression is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("'123'");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
               ast.string("123"), "accept a string");
    test.done();
  },

  'simple string expression with quote is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("'12\'3'");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
               ast.string('12\'3'), "accept a string");
    test.done();
  },
    
  'ident is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("azerty");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
               ast.ident("azerty"), "accept an ident");
    test.done();
  },
    
  'model construction is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("Point{1 '2'}");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
               ast.instance("Point", [ast.number(1), ast.string("2")]), "accept an instance");
    test.done();
  },
    
  'invocation is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("point.x");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
               ast.invoke(ast.ident("point"), ast.ident("x")), "accept an invocation");
    test.done();
  },
    
  'exotic invocation is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("point.'x'");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
               ast.invoke(ast.ident("point"), ast.string("x")), "accept an invocation");
    test.done();
  },
    
  'application is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("point (1) '2'");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
               ast.application([ast.ident("point"), ast.number(1), ast.string('2')]), "accept an application");
    test.done();
  },
};