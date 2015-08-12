'use strict';

var stream = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/stream.js'),
    language = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/language.js')(),
    list = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/list.js'),
    option = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/option.js'),
    fsdriver = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/resource/drivers/fsdriver.js'),
    reader = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/resource/reader.js'),
    packages = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/packages.js'),
    linker = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/linker.js');
    
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

exports['linker_expression'] = {
  setUp: function(done) {
    done();
  },
    
  'Link Number': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("123"),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list(), list()).isSuccess());
      
    test.done();
  },          

  'Link String': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('"123"'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list(), list()).isSuccess());
      
    test.done();
  },          

  'Link Unit': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('()'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list(), list()).isSuccess());
      
    test.done();
  },    
    
  'Link Variable Ident': function(test) {
    test.expect(2);
    // tests here  
    var aStream = stream('a'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("a"), list()).isSuccess());
    test.deepEqual(expression, 
                   { '$type': 'IdentExpr', value: 'a' });
      
    test.done();
  },    
    
  'Link Package Ident': function(test) {
    test.expect(2);
    // tests here  
    var aStream = stream('unit'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.specifications("Data.Unit"));      
      
    test.ok(aLinker.linkExpression("Data.Unit", expression, list(), list()).isSuccess());
    test.deepEqual(expression, 
                   { '$type': 'IdentExpr', value: 'unit', namespace: 'Data.Unit' });
      
    test.done();
  },    
    
  'Link Imported Ident': function(test) {
    test.expect(2);
    // tests here  
    var aStream = stream('unit'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.specifications("Data.Explicit"));      
    aPackages.define(aReader.specifications("Data.Unit"));      
      
    test.ok(aLinker.linkExpression("Data.Explicit", expression, list(), list()).isSuccess());
    test.deepEqual(expression, 
                   { '$type': 'IdentExpr', value: 'unit', namespace: 'Data.Unit' });
      
    test.done();
  },    

  'Link Invoke': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('a.run'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("a"), list()).isSuccess());
      
    test.done();
  },    

  'Cannot Link Invoke': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('a.run'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list(), list()).isFailure());
      
    test.done();
  },    

  'Link Pair': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('1,2'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("Pair"), list()).isSuccess());
      
    test.done();
  },    
  
  'Cannot Link left Pair': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('a,2'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("a","Pair"), list()).isSuccess());
      
    test.done();
  },    
  
  'Cannot Link right Pair': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('1,a'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("a","Pair"), list()).isSuccess());
      
    test.done();
  },    

  'Link Application': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('print "b"'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("print"), list()).isSuccess());
      
    test.done();
  },    
  
  'Cannot Link Application': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('print "b"'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list(), list()).isFailure());
      
    test.done();
  },    
  
  'Permissive Link Application': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('print b'), // May be 'b' is a method name
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("print"), list()).isSuccess());
      
    test.done();
  },
  
  'Link Simple Comprehension': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('for a <- l yield a'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("l"), list()).isSuccess());
      
    test.done();
  },    
/*  
  'Cannot Link Simple Comprehension': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('l.map (a -> b)'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    console.log(JSON.stringify(expression));
      
    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("l","Pair"), list()).isFailure());
      
    test.done();
  },    
*/    
  'Link One dependent Comprehension and conditional': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('for a <- l if a yield a'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("l"), list()).isSuccess());
      
    test.done();
  },    
/*    
  'Cannot Link One dependent Comprehension and conditional': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('for a <- l if b yield a'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("l"), list()).isFailure());
      
    test.done();
  },    
*/  
  'Link Two Comprehensions': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('for a <- l b <-l yield a,b'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("l","Pair"), list()).isSuccess());
      
    test.done();
  },    
  
  'Link Two dependent Comprehensions': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('for a <- l b <- a yield a,b'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("l","Pair"), list()).isSuccess());
      
    test.done();
  },    
  
  'Link Two dependent Comprehensions and conditional': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('for a <- l b <- a if a yield a,b'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("l","Pair"), list()).isSuccess());
      
    test.done();
  },    
/*  
  'Cannot Link Two dependent Comprehensions': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('for a <- b b <- l yield a,b'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("l","Pair"), list()).isFailure());
      
    test.done();
  },    
*/
  'Link Simple Tag': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('<a/>'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("document"), list()).isSuccess());
      
    test.done();
  },    

  'Link Tag with attributes': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('<a f=b/>'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("b","document"), list()).isSuccess());
      
    test.done();
  },  
/*
  'Cannot Link Tag with attributes': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('<a f=b/>'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("document"), list()).isFailure());
      
    test.done();
  },  
*/
  'Link Tag with body': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('<a> b </a>'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("b", "document"), list()).isSuccess());
      
    test.done();
  },  
/*
  'Cannot Link Tag with body': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('<a> b </a>'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("document"), list()).isFailure());
      
    test.done();
  }, 
*/    
  'Link Let value': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('let b = c in b'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("c"), list()).isSuccess());
      
    test.done();
  },      
    
  'Link Let typed value': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('let b : [a] a = c in b'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("c"), list()).isSuccess());
      
    test.done();
  },      
    
  'Link Let body': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('let b = 1 in b'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list(), list()).isSuccess());
      
    test.done();
  },      
    
  'Cannot Link Let value': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('let b = c in b'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list(), list()).isFailure());
      
    test.done();
  },      
    
  'Cannot Link Let body': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('let b = c in b'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list(), list()).isFailure());
      
    test.done();
  },      
    
  'Link Simple Abstraction': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('a -> 1'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list(), list()).isSuccess());
      
    test.done();
  },      
    
  'Link Identity Abstraction': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('a -> a'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list(), list()).isSuccess());
      
    test.done();
  },      
    
  'Link Typed Abstraction': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('a : [a] a -> a'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list(), list()).isSuccess());
      
    test.done();
  },      
    
  'Link New Model': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('new a with r = 1'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("a"), list()).isSuccess());
      
    test.done();
  },      
    
  'Link New Model Alteration': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('new a with r = b'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("a", "b"), list()).isSuccess());
      
    test.done();
  },      
    
  'Cannot Link New Model': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('new a with r = 1'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list(), list()).isFailure());
      
    test.done();
  },      

  'Cannot Link New Model Alteration': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('new a with r = b'),
        expression = language.parser.group('exprs').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkExpression(aPackages.main(), expression, list("a"), list()).isFailure());
      
    test.done();
  },      
};