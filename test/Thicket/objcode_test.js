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
                     [ [$i.MODEL, ['A', []]]]);
      test.done();
  },
    
  'Model with one attribute': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages), 
                                                                              ast.model("A",[],[ast.param("a",ast.type.native("a"))])).success())),
                     [ [$i.MODEL, ['A', [["a", [ [$i.ACCESS, 1],[$i.RETURN]]]]]]] );                     
      test.done();
  },

  'Model with two attributes': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages), 
                                                                              ast.model("A",list(),[ast.param("a1",ast.type.native("a")),
                                                                                                    ast.param("a2",ast.type.native("b"))])).success())), 
                     [ [$i.MODEL, ['A', [ ["a1", [ [$i.ACCESS, 1],[$i.RETURN]]], ["a2", [ [$i.ACCESS, 2],[$i.RETURN]]]]]]]);
      test.done();
  },

  'Simple controller': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages),
                                                                              ast.controller("A",[],ast.param("this",ast.type.native("a")),[],[])).success())),
                     [ [$i.CLASS, ['A', [], []]]]);
      test.done();
  },

  'Extended controller': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages),
                                                                              ast.controller("A",[],ast.param("this",ast.type.native("a")),[],[])).success())),
                     [ [$i.CLASS, ['A', [], []]]]);
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
                     [ [$i.CLASS, ['A', [ ["unbox", [ [$i.ACCESS, 2],[$i.RETURN]]]], []]]]);
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
                     [ [$i.CLASS, ['A', [ ["unbox", [ [$i.ACCESS, 1],[$i.RETURN]]]], []]]]);
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
                     [ [$i.CLASS, ['A', [ ["number.unbox", [ [$i.ACCESS, 1],[$i.RETURN]]]], []]]]);
      test.done();
  },

  'Simple trait': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages), ast.trait("A",[],[],[])).success())),
                     [ [$i.CLASS, ['A', [], []]]]);
      test.done();
  },

  'Extended trait': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages), 
                                                                              ast.trait("A",[],[],[],[ast.type.variable("B")])).success())),
                     [ [$i.CLASS, ['A', [], ['B']]]]);
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
                     [ [$i.CLASS, ['A', [ ["unbox", [ [$i.ACCESS, 2],[$i.RETURN]]]], []]]]);
      test.done();
  },

  'Simple Definition': function (test) {
      test.expect(1);
      
      var aPackages = packages(option.none());

      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.entity(environment(aPackages), ast.expression("A",ast.type.native("number"),ast.expr.number(1))).success())),
                     [ [$i.DEFINITION, ['A', [ [$i.IDENT,'number'], [$i.CONST,1] , [$i.APPLY]]]]]);
      test.done();
  },

  'Number': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.number(1)).success())),
                     [ [$i.IDENT,'number'], [$i.CONST,1] , [$i.APPLY]]);
      test.done();
  },
  
  'String': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.string("1")).success())),
                     [ [$i.IDENT,'string'], [$i.CONST,"1"] , [$i.APPLY]]);
      test.done();
  },

  'Unit': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.unit()).success())),
                    [ [$i.IDENT,'unit']]);
      test.done();
  },
    
  'Pair': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.pair(ast.expr.number(1),ast.expr.string("1"))).success())),
                     [[$i.IDENT,'Pair'],
                      [$i.PUSH, [ [$i.IDENT,'number'], [$i.CONST,1] , [$i.APPLY]]],
                      [$i.APPLY],
                      [$i.PUSH, [ [$i.IDENT,'string'], [$i.CONST,"1"] , [$i.APPLY]]],
                      [$i.APPLY]]);
      test.done();
  },

  'Global ident': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.ident("a")).success())),
                     [[$i.IDENT,'a']]);
      test.done();
  },

  'Lambda expression': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.abstraction("a", ast.expr.ident("a"))).success())),
                     [[$i.CLOSURE,[[$i.ACCESS, 1],[$i.RETURN]]]]);
      test.done();
  },

  'Apply expression': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list('b'), ast.expr.abstraction("b", ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b")))).success())),
                     [[$i.CLOSURE,[ [$i.IDENT,'a'], [$i.ACCESS, 1], [$i.TAILAPPLY]]]]);
      test.done();
  },

    'Invoke expression': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.invoke(ast.expr.ident("a"), "b")).success())),
                     [ [$i.IDENT,'a'], [$i.INVOKE,'b']]);
      test.done();
  },

  'Apply/Invoke expression': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b"))).success())),
                     [ [$i.IDENT,'a'], [$i.INVOKE,'b']]);
      test.done();
  },

  'Let expression': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.let("b",ast.namespace(ast.expr.ident("a"),'Main'),ast.expr.ident("b"))).success())),
                     [[$i.CLOSURE,[[$i.ACCESS, 1], [$i.RETURN]]], [$i.PUSH,[[$i.IDENT,'Main.a']]],[$i.APPLY]]);
      test.done();
  },

  'Simple Empty Tag': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(), ast.expr.tag("A",[],[])).success())),
                     [ [$i.IDENT,'document'],
                       [$i.PUSH, [ [$i.IDENT,'string'], [$i.CONST,'A'], [$i.APPLY]]],
                       [$i.APPLY], [$i.INVOKE,'create']]);
      test.done();
  },

  'Empty Tag with one attribute': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')]],[])).success())),
                     [[$i.IDENT,'document'],
                      [$i.PUSH, [ [$i.IDENT,'string'],[$i.CONST,'A'],[$i.APPLY]]],
                      [$i.APPLY], 
                      [$i.INVOKE,'create'],
                      [$i.INVOKE,'addAttribute'],
                      [$i.PUSH, [ [$i.IDENT,'string'],[$i.CONST,'a'],[$i.APPLY]]],
                      [$i.APPLY],
                      [$i.PUSH, [ [$i.IDENT,'string'],[$i.CONST,'b'],[$i.APPLY]]],
                      [$i.APPLY]]);
      test.done();
  },
  
  'Empty Tag with two attributes': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')],['b',ast.expr.number(1)]],[])).success())),
                     [[$i.IDENT,'document'],
                      [$i.PUSH, [ [$i.IDENT,'string'],[$i.CONST,'A'],[$i.APPLY]]],
                      [$i.APPLY], 
                      [$i.INVOKE,'create'],
                      [$i.INVOKE,'addAttribute'],
                      [$i.PUSH, [ [$i.IDENT,'string'],[$i.CONST,'a'],[$i.APPLY]]],
                      [$i.APPLY], 
                      [$i.PUSH, [ [$i.IDENT,'string'],[$i.CONST,'b'],[$i.APPLY]]],
                      [$i.APPLY],
                      [$i.INVOKE,'addAttribute'],
                      [$i.PUSH, [ [$i.IDENT,'string'],[$i.CONST,'b'],[$i.APPLY]]],
                      [$i.APPLY], 
                      [$i.PUSH, [ [$i.IDENT,'number'],[$i.CONST,1],[$i.APPLY]]],
                      [$i.APPLY]]);

      test.done();
  },

  'Tag with a simple content': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list('l'), ast.expr.tag("A",[],[ast.expr.tag("B",[],[]),ast.expr.number(1)])).success())),
                     [[$i.IDENT,'document'],
                      [$i.PUSH, [ [$i.IDENT,'string'],[$i.CONST,'A'],[$i.APPLY]]],
                      [$i.APPLY], 
                      [$i.INVOKE,'create'],
                      [$i.INVOKE,'addChild'],
                      [$i.IDENT,'document'],
                      [$i.PUSH, [ [$i.IDENT,'string'],[$i.CONST,'B'],[$i.APPLY]]],
                      [$i.APPLY], 
                      [$i.INVOKE,'create'],
                      [$i.APPLY],
                      [$i.INVOKE,'addChild'],
                      [$i.PUSH, [ [$i.IDENT,'number'],[$i.CONST,1],[$i.APPLY]]],
                      [$i.APPLY]]);
      test.done();
  },
  
  'New model alteration': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(),  
                                                                                  ast.expr.newModel(ast.expr.ident("a"),[["b",ast.expr.ident("b")]])).success())),
                     [[$i.IDENT,'a'],[$i.IDENT,'b'],[$i.ALTER,'b']]);
      test.done();
  },

  'New model with two alterations': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(deBruijn.indexes(compiler.expression(list(),  
                                                                                  ast.expr.newModel(ast.expr.ident("a"),[["b",ast.expr.ident("b")],["c",ast.expr.ident("c")]])).success())),
                     [[$i.IDENT,'a'],[$i.IDENT,'b'],[$i.ALTER,'b'],[$i.IDENT,'c'],[$i.ALTER,'c']]);
      test.done();
  },
 
};
    