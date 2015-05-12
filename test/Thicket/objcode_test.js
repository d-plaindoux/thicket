'use strict';

var ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/syntax/ast.js'),
    list = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/list.js'),
    compiler = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/generator/code2.js'),
    objcode = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/generator/objcode.js');

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
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.entity(list(),ast.model("A",[],[])).success())),
                     [ {'MODEL': ['A', []]} ]);
      test.done();
  },
  'Model with one attribute': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.entity([], ast.model("A",[],[ast.param("a",ast.type.native("a"))])).success())),
                     [ {'MODEL': ['A', [["a", [ {'ACCESS': 1} ]]]]} ] );                     
      test.done();
  },

  'Model with two attributes': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.entity(list(), ast.model("A",list(),[ast.param("a1",ast.type.native("a")),
                                                                                                         ast.param("a2",ast.type.native("b"))])).success())), 
                     [ {'MODEL': ['A', [ ["a1", [ {'ACCESS': 1} ]], ["a2", [ {'ACCESS': 2} ]] ]]} ]);
      test.done();
  },

  'Simple controller': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.entity(list(), ast.controller("A",[],ast.param("this",ast.type.native("a")),[],[])).success())),
                     [ {'CONTROLLER': ['A', []]} ]);
      test.done();
  },

  'Controller with unbox': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.entity(list(), 
                                        ast.controller("A",[],
                                                    ast.param("this",ast.type.native("a")),
                                                    [],
                                                    [ast.method("unbox", ast.expr.ident("this"))])).success())),
                     [ {'CONTROLLER': ['A', [ ["unbox", [ {'ACCESS': 1} ]] ]]} ]);
      test.done();
  },

  'Controller with filtered unbox': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.entity(list(ast.model('number',[],[])),
                                     ast.controller("A",[],
                                                    ast.param("this",ast.type.native("a")),
                                                    [],
                                                    [ast.method("unbox", ast.expr.ident("this"), ast.type.variable('number'))])).success())),
                     [ {'CONTROLLER': ['A', [ ["number.unbox", [ {'ACCESS': 1} ]] ]] } ]);
      test.done();
  },
    
  'Simple view': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.entity(list(), ast.view("A",[],ast.param("this",ast.type.native("a")),[ast.expr.number(1)])).success())),
                     [ {'VIEW': ['A', [ [ {'IDENT':'number'}, {'CONST':1} , {'APPLY':1} ] ]] } ]);
      test.done();
  },    

  'Simple Definition': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.entity(list(), ast.expression("A",ast.type.native("number"),ast.expr.number(1))).success())),
                     [ {'DEFINITION': ['A', [ {'IDENT':'number'}, {'CONST':1} , {'APPLY':1} ]] } ]);
      test.done();
  },

  'Number': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.expression(list(), list(), ast.expr.number(1)).success())),
                     [ {'IDENT':'number'}, {'CONST':1} , {'APPLY':1} ]);
      test.done();
  },
  
  'String': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.expression(list(), list(), ast.expr.string("1")).success())),
                     [ {'IDENT':'string'}, {'CONST':1} , {'APPLY':"1"} ]);
      test.done();
  },

  'Unit': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.expression(list(), list(), ast.expr.unit()).success())),
                    [ {'IDENT':'unit'} ]);
      test.done();
  },
    
  'Pair': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.expression(list(ast.model("Pair",[],[])), list(), ast.expr.pair(ast.expr.number(1),ast.expr.string("1"))).success())),
                     [{ IDENT : 'Pair' },
                      { LAZY : [ {'IDENT':'number'}, {'CONST':1} , {'APPLY':1} ] },
                      { APPLY : 1 },
                      { LAZY : [ {'IDENT':'string'}, {'CONST':"1"} , {'APPLY':1} ]},
                      { APPLY : 1 } ]);
      test.done();
  },

  'Global ident': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.expression(list(), list(), ast.expr.ident("a")).success())),
                     [{ IDENT : "a" }]);
      test.done();
  },

  'Lambda expression': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.expression(list(), list(), ast.expr.abstraction("a", ast.expr.ident("a"))).success())),
                     [{ CLOSURE : [{ ACCESS : 1 },{ RETURN : 1 }]}]);
      test.done();
  },

  'Apply expression': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.expression(list(), list('b'), ast.expr.abstraction("b", ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b")))).success())),
                     [ { CLOSURE: [ { IDENT: 'a' }, { ACCESS: 1 }, { TAILAPPLY: 1 } ] } ]);
      test.done();
  },

    'Invoke expression': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.expression(list(), list(), ast.expr.invoke(ast.expr.ident("a"), "b")).success())),
                     [ { IDENT: 'a' }, { INVOKE: 'b' } ]);
      test.done();
  },

  'Apply/Invoke expression': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.expression(list(), list(), ast.expr.application(ast.expr.ident("a"), ast.expr.ident("b"))).success())),
                     [ { IDENT: 'a' }, { INVOKE: 'b' } ]);
      test.done();
  },

  'Let expression': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.expression(list('a'), list(), ast.expr.let("b",ast.expr.ident("a"),ast.expr.ident("b"))).success())),
                     [ { CLOSURE: [ { ACCESS: 1 }, { RETURN: 1 } ] }, { IDENT: 'a' }, { APPLY: 1 } ]);
      test.done();
  },

  'Simple Empty Tag': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.expression(list(), list(), ast.expr.tag("A",[],[])).success())),
                     [ { TAG: { '$type': 'Tag', '$values': [ 'A', [], [] ] } } ]);
      test.done();
  },

  'Empty Tag with one attribute': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.expression(list(), list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')]],[])).success())),
                     [ { TAG: 
                         { '$type': 'Tag',
                           '$values': 
                            [ 'A',
                              [ [ 'a',
                                  { '$type': 'Apply',
                                    '$values': 
                                     [ { '$type': 'Ident', '$values': [ 'string' ] },
                                       { '$type': 'Native', '$values': [ 'b' ] } ] } ] ],
                              [] ] } } ]);
      test.done();
  },
    
  'Empty Tag with two attributes': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.expression(list(), list('l'), ast.expr.tag("A",[['a',ast.expr.string('b')],['b',ast.expr.number(1)]],[])).success())),
                     [ { TAG: 
                         { '$type': 'Tag',
                           '$values': 
                            [ 'A',
                              [ [ 'a',
                                  { '$type': 'Apply',
                                    '$values': 
                                     [ { '$type': 'Ident', '$values': [ 'string' ] },
                                       { '$type': 'Native', '$values': [ 'b' ] } ] } ],
                                [ 'b',
                                  { '$type': 'Apply',
                                    '$values': 
                                     [ { '$type': 'Ident', '$values': [ 'number' ] },
                                       { '$type': 'Native', '$values': [ 1 ] } ] } ] ],
                              [] ] } } ]);                 
      test.done();
  },

  'Tag with a simple content': function (test) {
      test.expect(1);
      
      test.deepEqual(objcode.generateObjCode(objcode.deBruijnIndex(compiler.expression(list(), list('l'), ast.expr.tag("A",[],[ast.expr.tag("B",[],[]),ast.expr.number(1)])).success())),
                     [ { TAG: 
                         { '$type': 'Tag',
                           '$values': 
                            [ 'A',
                              [],
                              [ { '$type': 'Tag', '$values': [ 'B', [], [] ] },
                                { '$type': 'Apply',
                                  '$values': 
                                   [ { '$type': 'Ident', '$values': [ 'number' ] },
                                     { '$type': 'Native', '$values': [ 1 ] } ] } ] ] } } ]);
      test.done();
  },
  
};
    