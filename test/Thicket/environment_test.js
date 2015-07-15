'use strict';

var option = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/option.js'),
    fsdriver = require('../../lib' + (process.env.THICKET_COV || '') + '/Resource/drivers/fsdriver.js'),
    reader = require('../../lib' + (process.env.THICKET_COV || '') + '/Resource/reader.js'),
    packages = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/data/packages.js'),
    environment = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/data/environment.js');

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

exports['environment'] = {
  setUp: function(done) {
    done();
  },

  'Empty environment has no type': function(test) {
    test.expect(1);
    // tests here  
    var aPackages = packages(option.none()),
        anEnvironment = environment(aPackages);

    test.ok(anEnvironment.getType("Data.Unit","unit").isFailure());
      
    test.done();
  },

  'Empty environment has no expression': function(test) {
    test.expect(1);
    // tests here  
    var aPackages = packages(option.none()),
        anEnvironment = environment(aPackages);

    test.ok(anEnvironment.getExpression("Data.Unit","unit").isFailure());
      
    test.done();
  },
   
  'Non empty environment has one type in a given package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        anEnvironment = environment(aPackages);

    aPackages.define(aReader.specifications("Data.Unit"));      
      
    test.ok(anEnvironment.getType("Data.Unit","unit").isSuccess());
      
    test.done();
  },
};
