'use strict';

var ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/syntax/ast.js'),
    atry = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/atry.js'),
    list = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/list.js'),
    dependency = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/dependency/loader.js');


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

exports['dependency'] = {
  setUp: function(done) {
      done();
  },

  'Dependency when imports are empty': function (test) {
      test.expect(1);
      var importation = ast.imports(["Core","Bool"],"bool");
      test.equal(dependency(null).contains(importation), false);
      test.done();
  },
    
  'Dependency adding a new import': function (test) {
      test.expect(1);
      var importation = ast.imports(["Core","Bool"],"bool"),
          loader = function () { return atry.success(list()); };
      test.ok(dependency(loader).resolve(importation).isSuccess());
      test.done();
  },
        
  'Dependency adding a new import and chekcking existence': function (test) {
      test.expect(1);
      var importation = ast.imports(["Core","Bool"],"bool"),
          loader = function () { return atry.success(list()); };
      
      dependency(loader).resolve(importation);
      
      test.ok(dependency(loader).contains(importation));
      test.done();
  },
  
};
