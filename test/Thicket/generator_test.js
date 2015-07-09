'use strict';

var ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/syntax/ast.js'),
    list = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/list.js'),
    compiler = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/generator/code.js');

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

exports['compile'] = {
  setUp: function(done) {
      done();
  },

  'Simple model': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.entity(list(),ast.model("A",[],[])).success(),
                    compiler.abstractSyntax("Model","A",[]));
      test.done();
  },

  'Model with one attribute': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.entity(list(), ast.model("A",[],[ast.param("a",ast.type.native("a"))])).success(),
                     compiler.abstractSyntax("Model","A",["a"]));
      test.done();
  },

  'Model with two attributes': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.entity(list(), ast.model("A",list(),[ast.param("a1",ast.type.native("a")),
                                                                   ast.param("a2",ast.type.native("b"))])).success(), 
                    compiler.abstractSyntax("Model","A",["a1", "a2"]));
      test.done();
  },

  'Simple controller': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.entity(list(), ast.controller("A",[],ast.param("this",ast.type.native("a")),[],[])).success(),
                     compiler.abstractSyntax("Controller","A","this",[]));
      test.done();
  },

  'Controller with unbox': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.entity(list(), 
                                     ast.controller("A",[],
                                                    ast.param("this",ast.type.native("a")),
                                                    [],
                                                    [ast.method("unbox", ast.expr.ident("this"))])).success(),
                    compiler.abstractSyntax("Controller","A","this",[["unbox",compiler.abstractSyntax("Variable","this")]]));
      test.done();
  },

    'Controller with filtered unbox': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.entity(list(ast.entity('number', ast.model('number',[],[]))),
                                     ast.controller("A",[],
                                                    ast.param("this",ast.type.native("a")),
                                                    [],
                                                    [ast.method("unbox", ast.expr.ident("this"), ast.type.variable('number'))])).success(),
                    compiler.abstractSyntax("Controller","A","this",[["number.unbox",compiler.abstractSyntax("Variable","this")]]));
      test.done();
  },
     
  'Simple Definition': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.entity(list(), ast.expression("A",ast.type.native("number"),ast.expr.number(1))).success(),
                     compiler.abstractSyntax("Definition","A",compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","number"), compiler.abstractSyntax("Native",1))));
      test.done();
  },
    
  'Number': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list(), ast.expr.number(1)).success(),
                     compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","number"), compiler.abstractSyntax("Native",1)));
      test.done();
  },
    
  'String': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list(), ast.expr.string("1")).success(),
                     compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","string"), compiler.abstractSyntax("Native","1")));
      test.done();
  },

  'Unit': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list(), ast.expr.unit()).success(),
                     compiler.abstractSyntax("Ident","unit"));
      test.done();
  },

  'Pair': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(ast.model("Pair",[],[])), list(), ast.expr.pair(ast.expr.number(1),ast.expr.string("1"))).success(),
                     compiler.abstractSyntax("Apply",
                                             compiler.abstractSyntax("Apply", 
                                                                     compiler.abstractSyntax("Ident", "Pair"),
                                                                     compiler.abstractSyntax("Lazy", compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","number"), compiler.abstractSyntax("Native",1)))),
                                             compiler.abstractSyntax("Lazy", compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","string"), compiler.abstractSyntax("Native","1")))));
      test.done();
  },
  
  'Local ident': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('a'), ast.expr.ident("a")).success(),
                     compiler.abstractSyntax("Variable","a"));
      test.done();
  },

  'Global ident': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list(), ast.expr.ident("a")).success(),
                     compiler.abstractSyntax("Ident","a"));
      test.done();
  },

  'Lambda expression': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list(), ast.expr.abstraction("a", ast.expr.ident("a"))).success(),
                     compiler.abstractSyntax("Function", "a", compiler.abstractSyntax("Variable","a")));
      test.done();
  },

  'Apply expression': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('a', 'b'), ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b"))).success(),
                     compiler.abstractSyntax("Apply", 
                                      compiler.abstractSyntax("Variable","a"),
                                      compiler.abstractSyntax("Variable","b")));
      test.done();
  },

    'Invoke expression': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('a', 'b'), ast.expr.invoke(ast.expr.ident("a"), "b")).success(),
                     compiler.abstractSyntax("Invoke",compiler.abstractSyntax("Variable","a"),"b"));
      test.done();
  },

  'Apply/Invoke expression': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('a'), ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b"))).success(),
                     compiler.abstractSyntax("Invoke",compiler.abstractSyntax("Variable","a"),"b"));
      test.done();
  },

  'Let expression': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('a'), ast.expr.let("b",ast.expr.ident("a"),ast.expr.ident("b"))).success(),
                     compiler.abstractSyntax("Apply", 
                                      compiler.abstractSyntax("Function","b",compiler.abstractSyntax("Variable","b")),
                                      compiler.abstractSyntax("Variable","a")));
      test.done();
  },
 
  'Comprehension expression': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('l'), ast.expr.comprehension(ast.expr.ident('x'),[['x',ast.expr.ident('l')]],[])).success(),
                     compiler.abstractSyntax("Apply", 
                                      compiler.abstractSyntax("Invoke", compiler.abstractSyntax("Variable","l"), "map"),
                                      compiler.abstractSyntax("Function","x",compiler.abstractSyntax("Variable","x"))));
      test.done();
  },
    
  'Comprehension expression with two map': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('l'), ast.expr.comprehension(ast.expr.ident('x'),[['x',ast.expr.ident('l')],['y',ast.expr.ident('m')]],[])).success(),
                     compiler.abstractSyntax("Apply", 
                                      compiler.abstractSyntax("Invoke", compiler.abstractSyntax("Ident","m"), "flatmap"),
                                      compiler.abstractSyntax("Function", "y",
                                                       compiler.abstractSyntax("Apply", 
                                                                        compiler.abstractSyntax("Invoke", compiler.abstractSyntax("Variable","l"), "map"),
                                                                        compiler.abstractSyntax("Function","x",compiler.abstractSyntax("Variable","x"))))));
      test.done();
  },

  'Comprehension expression with condition': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), 
                                     list('l'), 
                                     ast.expr.comprehension(ast.expr.ident('x'),
                                                            [['x',ast.expr.ident('l')]],
                                                            [ast.expr.ident("b")])).success(),
                    compiler.abstractSyntax("Apply", 
                                     compiler.abstractSyntax("Invoke", 
                                                      compiler.abstractSyntax("Apply", 
                                                                       compiler.abstractSyntax("Invoke", compiler.abstractSyntax("Variable","l"), "filter"),
                                                                       compiler.abstractSyntax("Function","x",compiler.abstractSyntax("Ident","b"))),
                                                      "map"
                                                     ),
                                     compiler.abstractSyntax("Function","x",compiler.abstractSyntax("Variable","x"))
                                    )
                    );
      test.done();
  },
    
  'Simple Empty Tag': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list(), ast.expr.tag("A",[],[])).success(),
                     compiler.abstractSyntax("Tag",
                                             compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","string"), compiler.abstractSyntax("Native","A")), 
                                             [], 
                                             []));
      test.done();
  },

  'Empty Tag with one attribute': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')]],[])).success(),
                     compiler.abstractSyntax("Tag", 
                                             compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","string"), compiler.abstractSyntax("Native","A")),
                                             [[compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","string"), compiler.abstractSyntax("Native","a")),
                                               compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","string"), compiler.abstractSyntax("Native","b"))]], 
                                             []));
      test.done();
  },
    
  'Empty Tag with two attributes': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')],['b',ast.expr.number(1)]],[])).success(),
                     compiler.abstractSyntax("Tag", 
                                             compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","string"), compiler.abstractSyntax("Native","A")), 
                                             [[compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","string"), compiler.abstractSyntax("Native","a")),
                                               compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","string"), compiler.abstractSyntax("Native","b"))],
                                              [compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","string"), compiler.abstractSyntax("Native","b")),
                                               compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","number"), compiler.abstractSyntax("Native",1))]], 
                                             []));                 
      test.done();
  },

  'Tag with a simple content': function (test) {
      test.expect(1);
      
      test.deepEqual(compiler.expression(list(), list('l'), ast.expr.tag("A",[],[ast.expr.tag("B",[],[]),ast.expr.number(1)])).success(),
                     compiler.abstractSyntax("Tag", 
                                             compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","string"), compiler.abstractSyntax("Native","A")), 
                                             [], 
                                             [compiler.abstractSyntax("Tag", 
                                                                      compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","string"), compiler.abstractSyntax("Native","B")), 
                                                                      [], 
                                                                      []), 
                                              compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","number"), compiler.abstractSyntax("Native",1))
                                             ]));
      test.done();
  },
  
};
    