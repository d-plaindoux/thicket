'use strict';

var option = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/option.js'),
    fsdriver = require('../../lib' + (process.env.THICKET_COV || '') + '/Resource/drivers/fsdriver.js'),
    reader = require('../../lib' + (process.env.THICKET_COV || '') + '/Resource/reader.js'),
    packages = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/data/packages.js'),
    linker = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/checker/linker.js');
    
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

exports['linker'] = {
  setUp: function(done) {
    done();
  },

  'Check namespace without packages': function(test) {
    test.expect(1);
    // tests here  
    var aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.findNamespace("Data.Unit","unit").isFailure());
      
    test.done();
  },

  'Check namespace for local definition': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.specifications("Data.Unit"));      
      
    test.equal(aLinker.findNamespace("Data.Unit","unit").success(),"Data.Unit");
      
    test.done();
  },

  'Check namespace for explicit import': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.specifications("Data.Explicit"));      
    aPackages.define(aReader.specifications("Data.Unit"));      
      
    test.equal(aLinker.findNamespace("Data.Explicit","unit").success(),"Data.Unit");
      
    test.done();
  },

  'Check namespace for implicit import': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.specifications("Data.Implicit"));      
    aPackages.define(aReader.specifications("Data.Unit"));      
      
    test.equal(aLinker.findNamespace("Data.Implicit","unit").success(),"Data.Unit");
      
    test.done();
  },

  'Check namespace for non explicit import': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.specifications("Data.Explicit"));      
    aPackages.define(aReader.specifications("Data.Unit"));      
      
    test.ok(aLinker.findNamespace("Data.Explicit","unit2").isFailure());
      
    test.done();
  },
};