'use strict';

var ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/ast.js'),
    option = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/option.js'),
    list = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/list.js'),
    compiler = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/generator/code.js'),
    deBruijn = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/generator/deBruijn.js'),
    objcode = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/generator/objcode.js'),
    packages = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/packages.js'),
    environment = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/environment.js'),
    $i = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/runtime/instruction.js');

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

exports['objcode'] = {
  setUp: function(done) {
      done();
  },

  'Simple model': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages),ast.model("A",[],[])).success())),
                     [ [$i.code.MODEL, ['A', []]]]);
      test.done();
  },
    
  'Model with one attribute': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages), 
                                                                              ast.model("A",[],[ast.param("a",ast.type.native("a"))])).success())),
                     [ [$i.code.MODEL, ['A', [["a", [ [$i.code.ACCESS, 1],[$i.code.RETURN]]]]]]] );                     
      test.done();
  },

  'Model with two attributes': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages), 
                                                                              ast.model("A",list(),[ast.param("a1",ast.type.native("a")),
                                                                                                    ast.param("a2",ast.type.native("b"))])).success())), 
                     [ [$i.code.MODEL, ['A', [ ["a1", [ [$i.code.ACCESS, 1],[$i.code.RETURN]]], ["a2", [ [$i.code.ACCESS, 2],[$i.code.RETURN]]]]]]]);
      test.done();
  },

  'Simple controller': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages),
                                                                              ast.controller("A",[],ast.param("this",ast.type.native("a")),[],[])).success())),
                     [ [$i.code.CLASS, ['A', [], []]]]);
      test.done();
  },

  'Extended controller': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages),
                                                                              ast.controller("A",[],ast.param("this",ast.type.native("a")),[],[])).success())),
                     [ [$i.code.CLASS, ['A', [], []]]]);
      test.done();
  },

  'Controller with unbox accessing self': function (test) {
      test.expect(1); 
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages), 
                                        ast.controller("A",[],
                                                    ast.param("this",ast.type.native("a")),
                                                    [],
                                                    [ast.method("unbox", ast.expr.ident("self"))])).success())),
                     [ [$i.code.CLASS, ['A', [ ["unbox", [ [$i.code.ACCESS, 2],[$i.code.RETURN]]]], []]]]);
      test.done();
  },

  'Controller with unbox accessing this': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages), 
                                        ast.controller("A",[],
                                                       ast.param("this",ast.type.native("a")),
                                                       [], 
                                                       [ast.method("unbox", ast.expr.ident("this"))])).success())),
                     [ [$i.code.CLASS, ['A', [ ["unbox", [ [$i.code.ACCESS, 1],[$i.code.RETURN]]]], []]]]);
      test.done();
  },

  'Controller with filtered unbox': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      aPackages.defineInRoot([], [ast.entity('number', ast.model('number',[],[]))]);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages),
                                     ast.controller("A",
                                                    [],
                                                    ast.param("this",ast.type.native("a")),
                                                    [],
                                                    [ast.method("unbox", ast.expr.ident("this"), ast.namespace(ast.type.variable('number'),"main"))])).success())),
                     [ [$i.code.CLASS, ['A', [ ["number.unbox", [ [$i.code.ACCESS, 1],[$i.code.RETURN]]]], []]]]);
      test.done();
  },

  'Simple trait': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages), ast.trait("A",[],[],[])).success())),
                     [ [$i.code.CLASS, ['A', [], []]]]);
      test.done();
  },

  'Extended trait': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages), 
                                                                              ast.trait("A",[],[],[],[ast.type.variable("B")])).success())),
                     [ [$i.code.CLASS, ['A', [], ['B']]]]);
      test.done();
  },

  'Trait with unbox accessing self': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages), 
                                        ast.trait("A",
                                                  [],
                                                  [],
                                                  [ast.method("unbox", ast.expr.ident("self"))])).success())),
                     [ [$i.code.CLASS, ['A', [ ["unbox", [ [$i.code.ACCESS, 2],[$i.code.RETURN]]]], []]]]);
      test.done();
  },

  'Simple Definition': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages), ast.expression("A",ast.type.native("number"),ast.expr.number(1))).success())),
                     [ [$i.code.DEFINITION, ['A', [ [$i.code.IDENT,'number'], [$i.code.CONST,1] , [$i.code.APPLY]]]]]);
      test.done();
  },

  'Number': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.number(1)).success())),
                     [ [$i.code.IDENT,'number'], [$i.code.CONST,1] , [$i.code.APPLY]]);
      test.done();
  },
  
  'String': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.string("1")).success())),
                     [ [$i.code.IDENT,'string'], [$i.code.CONST,"1"] , [$i.code.APPLY]]);
      test.done();
  },

  'Unit': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.unit()).success())),
                    [ [$i.code.IDENT,'unit']]);
      test.done();
  },
    
  'Pair': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.pair(ast.expr.number(1),ast.expr.string("1"))).success())),
                     [[$i.code.IDENT,'Pair'],
                      [$i.code.PUSH, [ [$i.code.IDENT,'number'], [$i.code.CONST,1] , [$i.code.APPLY]]],
                      [$i.code.APPLY],
                      [$i.code.PUSH, [ [$i.code.IDENT,'string'], [$i.code.CONST,"1"] , [$i.code.APPLY]]],
                      [$i.code.APPLY]]);
      test.done();
  },

  'Global ident': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.ident("a")).success())),
                     [[$i.code.IDENT,'a']]);
      test.done();
  },

  'Lambda expression': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.abstraction("a", ast.expr.ident("a"))).success())),
                     [[$i.code.CLOSURE,[[$i.code.ACCESS, 1],[$i.code.RETURN]]]]);
      test.done();
  },

  'Apply expression': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list('b'), ast.expr.abstraction("b", ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b")))).success())),
                     [[$i.code.CLOSURE,[ [$i.code.IDENT,'a'], [$i.code.ACCESS, 1], [$i.code.TAILAPPLY]]]]);
      test.done();
  },

    'Invoke expression': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.invoke(ast.expr.ident("a"), "b")).success())),
                     [ [$i.code.IDENT,'a'], [$i.code.INVOKE,'b']]);
      test.done();
  },

  'Apply/Invoke expression': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b"))).success())),
                     [ [$i.code.IDENT,'a'], [$i.code.INVOKE,'b']]);
      test.done();
  },

  'Let expression': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.let("b",ast.namespace(ast.expr.ident("a"),'Main'),ast.expr.ident("b"))).success())),
                     [[$i.code.CLOSURE,[[$i.code.ACCESS, 1], [$i.code.RETURN]]], [$i.code.PUSH,[[$i.code.IDENT,'Main.a']]],[$i.code.APPLY]]);
      test.done();
  },

  'Simple Empty Tag': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.tag("A",[],[])).success())),
                     [ [$i.code.IDENT,'document'],
                       [$i.code.PUSH, [ [$i.code.IDENT,'string'], [$i.code.CONST,'A'], [$i.code.APPLY]]],
                       [$i.code.APPLY], [$i.code.INVOKE,'create']]);
      test.done();
  },

  'Empty Tag with one attribute': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')]],[])).success())),
                     [[$i.code.IDENT,'document'],
                      [$i.code.PUSH, [ [$i.code.IDENT,'string'],[$i.code.CONST,'A'],[$i.code.APPLY]]],
                      [$i.code.APPLY], 
                      [$i.code.INVOKE,'create'],
                      [$i.code.INVOKE,'addAttribute'],
                      [$i.code.PUSH, [ [$i.code.IDENT,'string'],[$i.code.CONST,'a'],[$i.code.APPLY]]],
                      [$i.code.APPLY],
                      [$i.code.PUSH, [ [$i.code.IDENT,'string'],[$i.code.CONST,'b'],[$i.code.APPLY]]],
                      [$i.code.APPLY]]);
      test.done();
  },
  
  'Empty Tag with two attributes': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')],['b',ast.expr.number(1)]],[])).success())),
                     [[$i.code.IDENT,'document'],
                      [$i.code.PUSH, [ [$i.code.IDENT,'string'],[$i.code.CONST,'A'],[$i.code.APPLY]]],
                      [$i.code.APPLY], 
                      [$i.code.INVOKE,'create'],
                      [$i.code.INVOKE,'addAttribute'],
                      [$i.code.PUSH, [ [$i.code.IDENT,'string'],[$i.code.CONST,'a'],[$i.code.APPLY]]],
                      [$i.code.APPLY], 
                      [$i.code.PUSH, [ [$i.code.IDENT,'string'],[$i.code.CONST,'b'],[$i.code.APPLY]]],
                      [$i.code.APPLY],
                      [$i.code.INVOKE,'addAttribute'],
                      [$i.code.PUSH, [ [$i.code.IDENT,'string'],[$i.code.CONST,'b'],[$i.code.APPLY]]],
                      [$i.code.APPLY], 
                      [$i.code.PUSH, [ [$i.code.IDENT,'number'],[$i.code.CONST,1],[$i.code.APPLY]]],
                      [$i.code.APPLY]]);

      test.done();
  },

  'Tag with a simple content': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list('l'), ast.expr.tag("A",[],[ast.expr.tag("B",[],[]),ast.expr.number(1)])).success())),
                     [[$i.code.IDENT,'document'],
                      [$i.code.PUSH, [ [$i.code.IDENT,'string'],[$i.code.CONST,'A'],[$i.code.APPLY]]],
                      [$i.code.APPLY], 
                      [$i.code.INVOKE,'create'],
                      [$i.code.INVOKE,'addChilds'],
                      [$i.code.IDENT,'document'],
                      [$i.code.PUSH, [ [$i.code.IDENT,'string'],[$i.code.CONST,'B'],[$i.code.APPLY]]],
                      [$i.code.APPLY], 
                      [$i.code.INVOKE,'create'],
                      [$i.code.APPLY],
                      [$i.code.INVOKE,'addChilds'],
                      [$i.code.PUSH, [ [$i.code.IDENT,'number'],[$i.code.CONST,1],[$i.code.APPLY]]],
                      [$i.code.APPLY]]);
      test.done();
  },
  
  'New model alteration': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(),  
                                                                                  ast.expr.newModel(ast.expr.ident("a"),[["b",ast.expr.ident("b")]])).success())),
                     [[$i.code.IDENT,'a'],[$i.code.IDENT,'b'],[$i.code.ALTER,'b']]);
      test.done();
  },

  'New model with two alterations': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(),  
                                                                                  ast.expr.newModel(ast.expr.ident("a"),[["b",ast.expr.ident("b")],["c",ast.expr.ident("c")]])).success())),
                     [[$i.code.IDENT,'a'],[$i.code.IDENT,'b'],[$i.code.ALTER,'b'],[$i.code.IDENT,'c'],[$i.code.ALTER,'c']]);
      test.done();
  },
 
};
    