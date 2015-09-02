'use strict';

var ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/ast.js'),
    option = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/option.js'),
    list = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/list.js'),
    compiler = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/generator/code.js'),
    deBruijn = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/generator/deBruijn.js'),
    packages = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/packages.js'),
    environment = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/environment.js');


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

exports['deBruijn'] = {
  setUp: function(done) {
      done();
  },

  'Simple model': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(deBruijn.indexes(compiler.entity(environment(aPackages),ast.model("A",[],[])).success()),
                    compiler.abstractSyntax("Model","A",[]));
      test.done();
  },

  'Model with one attribute': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());
      
      test.deepEqual(deBruijn.indexes(compiler.entity(environment(aPackages), ast.model("A",[],[ast.param("a",ast.type.native("a"))])).success()),
                     compiler.abstractSyntax("Model","A",[["a",compiler.abstractSyntax("Variable",1)]]));
      test.done();
  },

  'Model with two attributes': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());
      
      test.deepEqual(deBruijn.indexes(compiler.entity(environment(aPackages), 
                                                      ast.model("A",list(),[ast.param("a1",ast.type.native("a")),
                                                                            ast.param("a2",ast.type.native("b"))])).success()), 
                    compiler.abstractSyntax("Model","A",[["a1",compiler.abstractSyntax("Variable",1)], 
                                                         ["a2",compiler.abstractSyntax("Variable",2)]]));
      test.done();
  },

  'Simple controller': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());
      
      test.deepEqual(deBruijn.indexes(compiler.entity(environment(aPackages), 
                                                      ast.controller("A",
                                                                     [],
                                                                     ast.param("this",ast.type.native("a")),
                                                                     [],
                                                                     [])
                                                     ).success()),
                     compiler.abstractSyntax("Controller","A",[],[]));
      test.done();
  },

  'Extended controller': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());
      
      test.deepEqual(deBruijn.indexes(compiler.entity(environment(aPackages), 
                                                      ast.controller("A",
                                                                     [],
                                                                     ast.param("this",ast.type.native("a")),
                                                                     [],
                                                                     [],
                                                                     [ast.type.variable("B")])
                                                     ).success()),
                     compiler.abstractSyntax("Controller","A",[],["B"]));
      test.done();
  },

  'Controller with unbox': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(deBruijn.indexes(compiler.entity(environment(aPackages), 
                                        ast.controller("A",
                                                       [],
                                                        ast.param("this",ast.type.native("a")),
                                                        [],
                                                        [ast.method("unbox", ast.expr.ident("this"))])).success()),
                    compiler.abstractSyntax("Controller","A",[["unbox",compiler.abstractSyntax("Variable",1)]],[]));
      test.done();
  },

    'Controller with filtered unbox': function (test) {
      test.expect(1);
    
      var aPackages = packages(option.none());
        
      aPackages.defineInRoot([], [ast.entity('number',ast.model('number',[],[]))]);
    
      test.deepEqual(deBruijn.indexes(compiler.entity(environment(aPackages),
                                     ast.controller("A",
                                                    [],
                                                    ast.param("this",ast.type.native("a")),
                                                    [],
                                                    [ast.method("unbox", ast.expr.ident("this"), ast.type.variable('number'))])).success()),
                    compiler.abstractSyntax("Controller","A",[["number.unbox",compiler.abstractSyntax("Variable",1)]],[]));
      test.done();
  },
     
  'Simple trait': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());
      
      test.deepEqual(deBruijn.indexes(compiler.entity(environment(aPackages), ast.trait("A",[],[],[])).success()),
                     compiler.abstractSyntax("Trait","A",[],[]));
      test.done();
  },
    
  'Extended trait': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());
      
      test.deepEqual(deBruijn.indexes(compiler.entity(environment(aPackages), 
                                                      ast.trait("A",
                                                                [],
                                                                [],
                                                                [],
                                                                [ast.type.variable("B")])
                                                     ).success()),
                     compiler.abstractSyntax("Trait","A",[],["B"]));
      test.done();
  },

  'Simple Definition': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(deBruijn.indexes(compiler.entity(environment(aPackages), 
                                                      ast.expression("A",ast.type.native("number"),ast.expr.number(1))).success()),
                     compiler.abstractSyntax("Definition","A",
                                             compiler.abstractSyntax("Apply",
                                                                     compiler.abstractSyntax("Ident","number"), 
                                                                     compiler.abstractSyntax("Native",1))));
      test.done();
  },
    
  'Number': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list(), ast.expr.number(1)).success()),
                     compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","number"), 
                                             compiler.abstractSyntax("Native",1)));
      test.done();
  },
    
  'String': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list(), ast.expr.string("1")).success()),
                     compiler.abstractSyntax("Apply",compiler.abstractSyntax("Ident","string"), 
                                             compiler.abstractSyntax("Native","1")));
      test.done();
  },

  'Unit': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list(), ast.expr.unit()).success()),
                     compiler.abstractSyntax("Ident","unit"));
      test.done();
  },

  'Pair': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list(), ast.expr.pair(ast.expr.number(1),ast.expr.string("1"))).success()),
                     compiler.abstractSyntax("Apply",
                                             compiler.abstractSyntax("Apply", 
                                                                     compiler.abstractSyntax("Ident", "Pair"),
                                                                     compiler.abstractSyntax("Lazy", 
                                                                                             compiler.abstractSyntax("Apply",
                                                                                                                     compiler.abstractSyntax("Ident","number"), 
                                                                                                                     compiler.abstractSyntax("Native",1)))),
                                             compiler.abstractSyntax("Lazy", compiler.abstractSyntax("Apply",
                                                                                                     compiler.abstractSyntax("Ident","string"),
                                                                                                     compiler.abstractSyntax("Native","1")))));
      test.done();
  },

  'Global ident': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list(), ast.expr.ident("a")).success()),
                     compiler.abstractSyntax("Ident","a"));
      test.done();
  },

  'Lambda expression': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list(), ast.expr.abstraction("a", ast.expr.ident("a"))).success()),
                     compiler.abstractSyntax("Function", compiler.abstractSyntax("Variable",1)));
      test.done();
  },

  'Apply expression': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list('b'), 
                                                          ast.expr.abstraction("b",
                                                                               ast.expr.application(ast.expr.ident("a"), 
                                                                                                    ast.expr.ident("b")))
                                                         ).success()),
                     compiler.abstractSyntax("Function", 
                                             compiler.abstractSyntax("Apply", 
                                                                     compiler.abstractSyntax("Ident","a"),
                                                                     compiler.abstractSyntax("Variable",1))));
      test.done();
  },

  'Invoke expression': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list(), ast.expr.invoke(ast.expr.ident("a"), "b")).success()),
                     compiler.abstractSyntax("Invoke",compiler.abstractSyntax("Ident","a"),"b"));
      test.done();
  },

  'Apply/Invoke expression': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list(), ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b"))).success()),
                     compiler.abstractSyntax("Invoke",compiler.abstractSyntax("Ident","a"),"b"));
      test.done();
  },

  'Let expression': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list(), ast.expr.let("b",ast.namespace(ast.expr.ident("a"),aPackages.main()),ast.expr.ident("b"))).success()),
                     compiler.abstractSyntax("Apply", 
                                      compiler.abstractSyntax("Function",compiler.abstractSyntax("Variable",1)),
                                      compiler.abstractSyntax('Lazy', compiler.abstractSyntax("Ident",aPackages.main() + ".a"))));
      test.done();
  },
 
  'Comprehension expression': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list(), ast.expr.comprehension(ast.expr.ident('x'),[['x',ast.expr.ident('l')]],[])).success()),
                     compiler.abstractSyntax("Apply", 
                                      compiler.abstractSyntax("Invoke", compiler.abstractSyntax("Ident","l"), "map"),
                                      compiler.abstractSyntax("Function",compiler.abstractSyntax("Variable",1))));
      test.done();
  },
    
  'Comprehension expression with two map': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list(), ast.expr.comprehension(ast.expr.ident('x'),[['y',ast.expr.ident('m')],['x',ast.expr.ident('l')]],[])).success()),
                     compiler.abstractSyntax("Apply", 
                                      compiler.abstractSyntax("Invoke", compiler.abstractSyntax("Ident","m"), "flatmap"),
                                      compiler.abstractSyntax("Function", 
                                                       compiler.abstractSyntax("Apply", 
                                                                        compiler.abstractSyntax("Invoke", compiler.abstractSyntax("Ident","l"), "map"),
                                                                        compiler.abstractSyntax("Function",compiler.abstractSyntax("Variable",2))))));
      test.done();
  },

  'Comprehension expression with condition': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list(), 
                                                           ast.expr.comprehension(ast.expr.ident('x'),
                                                                                  [['x',ast.expr.ident('l')]],
                                                                                  [ast.expr.ident("b")])).success()),
                    compiler.abstractSyntax("Apply", 
                                     compiler.abstractSyntax("Invoke", 
                                                      compiler.abstractSyntax("Apply", 
                                                                       compiler.abstractSyntax("Invoke", compiler.abstractSyntax("Ident","l"), "filter"),
                                                                       compiler.abstractSyntax("Function",compiler.abstractSyntax("Ident","b"))),
                                                      "map"
                                                     ),
                                     compiler.abstractSyntax("Function",compiler.abstractSyntax("Variable","1"))
                                    )
                    );
      test.done();
  },
    
  'Simple Empty Tag': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list(), ast.expr.tag("A",[],[])).success()),
                     compiler.abstractSyntax("Invoke",
                         compiler.abstractSyntax("Apply",
                             compiler.abstractSyntax("Ident", "document"),
                             compiler.abstractSyntax('Lazy',
                                 compiler.abstractSyntax("Apply",
                                     compiler.abstractSyntax("Ident","string"), 
                                     compiler.abstractSyntax("Native","A")))),
                         "create"));
      test.done();
  },

  'Empty Tag with one attribute': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')]],[])).success()),
                     compiler.abstractSyntax("Apply",
                         compiler.abstractSyntax("Apply",
                             compiler.abstractSyntax("Invoke",
                                 compiler.abstractSyntax("Invoke",
                                     compiler.abstractSyntax("Apply",
                                         compiler.abstractSyntax("Ident", "document"),
                                             compiler.abstractSyntax('Lazy',
                                                 compiler.abstractSyntax("Apply",
                                                     compiler.abstractSyntax("Ident","string"), 
                                                     compiler.abstractSyntax("Native","A")))),
                                     "create"),
                                 "addAttribute"),
                             compiler.abstractSyntax('Lazy',
                                 compiler.abstractSyntax("Apply",
                                     compiler.abstractSyntax("Ident","string"), 
                                     compiler.abstractSyntax("Native","a")))),
                         compiler.abstractSyntax('Lazy',                                             
                             compiler.abstractSyntax("Apply",
                                 compiler.abstractSyntax("Ident","string"), 
                                 compiler.abstractSyntax("Native","b")))));
      test.done();
  },
    
  'Empty Tag with two attributes': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')],['b',ast.expr.number(1)]],[])).success()),
                     compiler.abstractSyntax("Apply",
                         compiler.abstractSyntax("Apply",
                             compiler.abstractSyntax("Invoke",
                                 compiler.abstractSyntax("Apply",
                                     compiler.abstractSyntax("Apply",
                                         compiler.abstractSyntax("Invoke",
                                             compiler.abstractSyntax("Invoke",
                                                 compiler.abstractSyntax("Apply",
                                                     compiler.abstractSyntax("Ident", "document"),
                                                     compiler.abstractSyntax('Lazy',
                                                         compiler.abstractSyntax("Apply",
                                                             compiler.abstractSyntax("Ident","string"), 
                                                             compiler.abstractSyntax("Native","A")))),
                                                     "create"),
                                             "addAttribute"),
                                         compiler.abstractSyntax('Lazy',
                                             compiler.abstractSyntax("Apply",
                                                 compiler.abstractSyntax("Ident","string"), 
                                                 compiler.abstractSyntax("Native","a")))),
                                     compiler.abstractSyntax('Lazy',
                                         compiler.abstractSyntax("Apply",
                                             compiler.abstractSyntax("Ident","string"), 
                                             compiler.abstractSyntax("Native","b")))),
                                 "addAttribute"),
                             compiler.abstractSyntax('Lazy',
                                 compiler.abstractSyntax("Apply",
                                     compiler.abstractSyntax("Ident","string"), 
                                     compiler.abstractSyntax("Native","b")))),
                         compiler.abstractSyntax('Lazy',
                             compiler.abstractSyntax("Apply",
                                 compiler.abstractSyntax("Ident","number"), 
                                 compiler.abstractSyntax("Native",1)))));
      test.done();
  },

  'Tag with a simple content': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list('l'), ast.expr.tag("A",[],[ast.expr.tag("B",[],[]),ast.expr.number(1)])).success()),
                     compiler.abstractSyntax("Apply",
                         compiler.abstractSyntax("Invoke",
                             compiler.abstractSyntax("Apply",
                                 compiler.abstractSyntax("Invoke",
                                     compiler.abstractSyntax("Invoke",
                                         compiler.abstractSyntax("Apply",
                                             compiler.abstractSyntax("Ident", "document"),
                                             compiler.abstractSyntax('Lazy',
                                                 compiler.abstractSyntax("Apply",
                                                     compiler.abstractSyntax("Ident","string"), 
                                                     compiler.abstractSyntax("Native","A")))),
                                         "create"),
                                     "addChild"),
                                 compiler.abstractSyntax("Invoke",
                                     compiler.abstractSyntax("Apply",
                                         compiler.abstractSyntax("Ident", "document"),
                                         compiler.abstractSyntax('Lazy',
                                             compiler.abstractSyntax("Apply",
                                                 compiler.abstractSyntax("Ident","string"), 
                                                 compiler.abstractSyntax("Native","B")))),
                                     "create")),
                             "addChild"),
                         compiler.abstractSyntax('Lazy',
                             compiler.abstractSyntax("Apply",
                                 compiler.abstractSyntax("Ident","number"), 
                                 compiler.abstractSyntax("Native","1")))));
      test.done();
  },

  'New model': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list(), ast.expr.newModel(ast.expr.ident("a"),[["b",ast.expr.ident("b")]])).success()),
                     compiler.abstractSyntax("Alter",
                                             compiler.abstractSyntax("Ident","a"),
                                             'b',
                                             compiler.abstractSyntax("Ident","b")));
      test.done();
  },

  'New model with a variable': function (test) {
      test.expect(1);
      
      test.deepEqual(deBruijn.indexes(compiler.expression(list(), ast.expr.abstraction("a", ast.expr.newModel(ast.expr.ident("a"),[["b",ast.expr.ident("b")]]))).success()),
                     compiler.abstractSyntax("Function",
                             compiler.abstractSyntax("Alter",
                                                     compiler.abstractSyntax("Variable", 1),
                                                     'b',
                                                     compiler.abstractSyntax("Ident","b"))));
      test.done();
  },
};
    