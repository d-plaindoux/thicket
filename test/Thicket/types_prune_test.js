'use strict';

var types = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/checker/types.js'),
    ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/syntax/ast.js'),
    pair = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/pair.js'),
    list = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/list.js');     

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

exports['types_freevar'] = {
  setUp: function(done) {
    done();
  },

  "Pruning native is identity": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.prune(list(), ast.type.native("a")),
                     ast.type.native("a"), 
                     "Prune native");
      test.done();
  },
    
  "Pruning free variable is identity": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.prune(list(), 
                                 ast.type.variable("a")), 
                     ast.type.variable("a"), 
                     "Prune free variable");
      test.done();
  },
    
  "Pruning bound variable": function (test) {
      test.expect(1);
      // Test
      test.deepEqual(types.prune(list(pair("a",ast.type.native("a"))), 
                                 ast.type.variable("a")), 
                     ast.type.native("a"), 
                     "Prune bound variable");
      test.done();
  },

};
 