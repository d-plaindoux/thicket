'use strict';

var atry = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/atry.js'),
    dependencies = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/symbol/dependencies.js');


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
      var importation = ["Core","Bool"];
      test.equal(dependencies(null).contains(importation), false);
      test.done();
  },
    
  'Dependency adding a new import': function (test) {
      test.expect(1);
      var importation = ["Core","Bool"],
          loader = function (aModule) { return atry.success(aModule); };
      test.ok(dependencies(loader).resolve(importation).isSuccess());
      test.done();
  },
        
  'Dependency adding a new import and chekcking existence': function (test) {
      test.expect(1);
      var importation = ["Core","Bool"],
          loader = function (aModule) { return atry.success(aModule); },
          dependency = dependencies(loader);
      
      dependency.resolve(importation);
      
      test.ok(dependency.contains(importation));
      test.done();
  },
  
};
