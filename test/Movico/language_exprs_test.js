'use strict';

var stream = require('../../lib' + (process.env.MOVICO_COV || '') + '/Parser/stream.js').stream,
    language = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/language.js').language,
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
    
/*
  'string expression with dquote is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('"12\"3"');
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
               ast.string("12\"3"), "accept a string");
    test.done();
  },
*/
    
  'simple string expression is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("'123'");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
               ast.string("123"), "accept a string");
    test.done();
  },

/*
  'simple string expression with quote is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("'12\'3'");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
               ast.string('12\'3'), "accept a string");
    test.done();
  },
*/
    
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
    
  'pair is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("1,'2'");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.pair(ast.number(1), ast.string('2')), "accept an application");
    test.done();
  },

  'application using pair is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("point (1,'2')");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.application([ast.ident("point"), ast.pair(ast.number(1), ast.string('2'))]), "accept an application");
    test.done();
  },  

  'comprehension is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("[(x,y) for x <- f a for y <- t 1 if eq x y]");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.comprehension(ast.pair(ast.ident('x'),ast.ident('y')),
                                     [[ast.ident('x'),ast.application([ast.ident('f'),ast.ident('a')])],
                                      [ast.ident('y'),ast.application([ast.ident('t'),ast.number(1)])]],
                                     [ast.application([ast.ident('eq'),ast.ident('x'),ast.ident('y')])]),
                   "accept a comprehension");
    test.done();
  },  
    
  'empty tag is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("<a></a>");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.tag("a",[],[]),
                   "accept a xhtml fragment");
    test.done();
  },  

  'empty tag with attributes is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("<a n=(f 1) m='4'></a>");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.tag("a",[['n',ast.application([ast.ident('f'),ast.number(1)])],['m',ast.string('4')]],[]),
                   "accept a xhtml fragment");
    test.done();
  },  
    
  'tag with attributes is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("<a n=(f 1) m='4'> 123 </a>");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.tag("a",[['n',ast.application([ast.ident('f'),ast.number(1)])],['m',ast.string('4')]],[ast.number(123)]),
                   "accept a xhtml fragment");
    test.done();
  },  
};