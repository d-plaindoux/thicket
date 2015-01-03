'use strict';

var entities = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/entities.js').entities,
    ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/ast.js').ast,
    // pair = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/pair.js').pair,
    list = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/list.js').list;

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

exports['entities'] = {
  setUp: function(done) {
      done();
  },

  "Analyse empty controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.controller("A",[],ast.param("this",ast.type.native("number")),[],[]);
      test.ok(entities.analyse(list(), aController).isSuccess(),
              "Empty controller");
      test.done();
  },
    
  "Analyse simple controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.controller("A",[],
                                       ast.param("this",ast.type.native("number")),
                                       [ ast.param("m", ast.type.native("number")) ],
                                       [ ast.method("m", ast.expr.number(1)) ]);
      test.ok(entities.analyse(list(), aController).isSuccess(),
              "Empty controller");
      test.done();
  },
    
  "Analyse simple wrong controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.controller("A",[],
                                       ast.param("this",ast.type.native("number")),
                                       [ ast.param("m", ast.type.native("string")) ],
                                       [ ast.method("m", ast.expr.number(1)) ]);
      test.ok(entities.analyse(list(), aController).isFailure(),
              "Empty controller");
      test.done();
  },
    
  "Analyse simple partial controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.controller("A",[],
                                       ast.param("this",ast.type.native("number")),
                                       [ ],
                                       [ ast.method("m", ast.expr.number(1)) ]);
      test.ok(entities.analyse(list(), aController).isFailure(),
              "Empty controller");
      test.done();
  }
};
