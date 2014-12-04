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

exports['language_exprs'] = {
  setUp: function(done) {
    done();
  },
    
  'number expression is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("123");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
               ast.expr.number(123), "accept a number");
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
    
  'model construction is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("Point{1 '2'}");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.instance("Point", [ast.expr.number(1), ast.expr.string("2")]), "accept an instance");
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
    
  'let definition function with unit is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("let f () = 1 in x");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.let('f', ast.expr.abstraction(ast.param("_",ast.type.native("unit")), ast.expr.number(1)), 
                                ast.expr.ident('x')),
                   "accept a let definition");
    test.done();
  },  
    
  'let definition function with an int is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("let f x:int = 1 in x");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.let('f', ast.expr.abstraction(ast.param("x",ast.type.native("int")), ast.expr.number(1)), 
                                ast.expr.ident('x')),
                   "accept a let definition");
    test.done();
  },  
    
  'let definition function with an int and a string is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("let f x:int y:string = 1 in x");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.let('f', ast.expr.abstraction(ast.param("x",ast.type.native("int")), 
                                                          ast.expr.abstraction(ast.param("y",ast.type.native("string")),ast.expr.number(1))), 
                                ast.expr.ident('x')),
                   "accept a let definition");
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

  'empty tag with attributes is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("<a n=(f 1) m='4'></a>");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.tag("a",[['n',ast.expr.application(ast.expr.ident('f'),ast.expr.number(1))],['m',ast.expr.string('4')]],[]),
                   "accept a xhtml fragment");
    test.done();
  },  
    
  'tag with attributes is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("<a n=(f 1) m='4'> 123 </a>");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.tag("a",[['n',ast.expr.application(ast.expr.ident('f'),ast.expr.number(1))],['m',ast.expr.string('4')]],[ast.expr.number(123)]),
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
    
  'abstraction with unit': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("fun () => 1");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.abstraction(ast.param("_",ast.type.native("unit")), ast.expr.number(1)),
                   "accept function");
    test.done();
  },  
    
  'abstraction with int': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("fun x:int => 1");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.abstraction(ast.param("x",ast.type.native("int")), ast.expr.number(1)),
                   "accept function");
    test.done();
  },  
    
  'abstraction with int and string': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("fun x:int y:string => 1");
        
    test.deepEqual(language.parser.group('exprs').parse(aStream).get(), 
                   ast.expr.abstraction(ast.param("x",ast.type.native("int")), 
                                        ast.expr.abstraction(ast.param("y",ast.type.native("string")), ast.expr.number(1))),
                   "accept function");
    test.done();
  },  
};