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

exports['language_exprs'] = {
  setUp: function(done) {
    done();
  },
    
  'number integer expression is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("123");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.number(123), "accept a number");
    test.done();
  },
    
  'number float expression is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("123.23");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.number(123.23), "accept a number");
    test.done();
  },
    
  'number small float expression is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("1e-12");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.number(1e-12), "accept a number");
    test.done();
  },
    
  'string expression is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('"123"');
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.string("123"), "accept a string");
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
                   ast.expr.string("123"), "accept a string");
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
                   ast.expr.ident("azerty"), "accept an ident");
    test.done();
  },
    
  'invocation is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("point.x");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.invoke(ast.expr.ident("point"), "x"), "accept an invocation");
    test.done();
  },
    
  'mutiple invocation is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("figure.point.x");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.invoke(ast.expr.invoke(ast.expr.ident("figure"), "point"), "x"), "accept an invocation");
    test.done();
  },
    
  'application is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("point (1) '2'");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.application(ast.expr.application(ast.expr.ident("point"), ast.expr.number(1)), ast.expr.string('2')), "accept an application");
    test.done();
  },
    
  'pair is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("1,'2'");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.pair(ast.expr.number(1), ast.expr.string('2')), "accept an application");
    test.done();
  },

  'application using pair is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("point (1,'2')");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.application(ast.expr.ident("point"), ast.expr.pair(ast.expr.number(1), ast.expr.string('2'))), "accept an application");
    test.done();
  },  

  'comprehension is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("[(x,y) for x in f a for y in t 1 if eq x y]");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.comprehension(ast.expr.pair(ast.expr.ident('x'),ast.expr.ident('y')),
                                          [['x',ast.expr.application(ast.expr.ident('f'),ast.expr.ident('a'))],
                                           ['y',ast.expr.application(ast.expr.ident('t'),ast.expr.number(1))]],
                                          [ast.expr.application(ast.expr.application(ast.expr.ident('eq'),ast.expr.ident('x')),ast.expr.ident('y'))]),
                   "accept a comprehension");
    test.done();
  },  
    
  'let definition is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("let x = 1 in x");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.let('x', ast.expr.number(1), ast.expr.ident('x')),
                   "accept a let definition");
    test.done();
  },  
    
  'canonical empty tag is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("<a/>");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.tag("a",[],[]),
                   "accept a xhtml fragment");
    test.done();
  },  
    
  'empty tag is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("<a></a>");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.tag("a",[],[]),
                   "accept a xhtml fragment");
    test.done();
  },  

  'canonical empty tag with attributes is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("<a n=(f 1) m='4'/>");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.tag("a",[['n',ast.expr.application(ast.expr.ident('f'),ast.expr.number(1))],
                                     ['m',ast.expr.string('4')]],
                                []),
                   "accept a xhtml fragment");
    test.done();
  },  
    
  'empty tag with attributes is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("<a n=(f 1) m='4'></a>");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.tag("a",[['n',ast.expr.application(ast.expr.ident('f'),ast.expr.number(1))],
                                     ['m',ast.expr.string('4')]],
                                []),
                   "accept a xhtml fragment");
    test.done();
  },      
    
  'tag with attributes is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("<a n=(f 1) m='4'> 123 </a>");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.tag("a",[['n',ast.expr.application(ast.expr.ident('f'),ast.expr.number(1))],
                                     ['m',ast.expr.string('4')]],
                                [ast.expr.number(123)]),
                   "accept a xhtml fragment");
    test.done();
  },  
    
  'not well formed tag': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("<a></b>");
        
    test.equal(language.parser.group('exprs').parse(aStream).isPresent(), false, "reject a xhtml fragment");
    test.done();
  },  
    
  'abstraction with x': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("x -> 1");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.abstraction("x", ast.expr.number(1)),
                   "accept function");
    test.done();
  },  
    
  'abstraction with typed x': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("x:int -> 1");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.abstraction("x", ast.expr.number(1), ast.type.variable('int')),
                   "accept function");
    test.done();
  },  
    
  'abstraction with x and y': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("x y -> 1");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.abstraction("x", ast.expr.abstraction("y", ast.expr.number(1))),
                   "accept function");
    test.done();
  },
    
  'expression with an operator': function (test) {
    test.expect(1);
    // tests here  
    var aStream = stream("x.(+)");
        
    test.deepEqual(language.parser.group('expr').parse(aStream).get(), 
                   ast.expr.invoke(ast.expr.ident("x"),"+"),
                   "Expression with an operator");
    test.done();      
  },
    
  'expression with an infix operator': function (test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(x + y)");
        
    test.deepEqual(language.parser.group('expr').parse(aStream).get(), 
                   ast.expr.application(ast.expr.application(ast.expr.ident("x"),ast.expr.ident("+")), ast.expr.ident("y")),
                   "Expression with an operator");
    test.done();      
  }
};