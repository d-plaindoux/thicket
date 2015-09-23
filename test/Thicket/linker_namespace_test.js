'use strict';

var option = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/option.js'),
    fsdriver = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/resource/drivers/fsdriver.js'),
    reader = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/resource/reader.js'),
    packages = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/packages.js'),
    linker = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/linker.js');
    
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

exports['linker_namespace'] = {
  setUp: function(done) {
    done();
  },

  'Check namespace for local type definition': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.code("Data.Unit"));      
      
    test.equal(aLinker.findTypeNamespace("Data.Unit","unit").success(),"Data.Unit");
      
    test.done();
  },

  'Check namespace for local expression definition': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.code("Data.Unit"));      
      
    test.equal(aLinker.findExpressionNamespace("Data.Unit","unit").success(),"Data.Unit");
      
    test.done();
  },

  'Check namespace for type explicit import': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.code("Data.Explicit"));      
    aPackages.define(aReader.code("Data.Unit"));      
      
    test.equal(aLinker.findTypeNamespace("Data.Explicit","unit").success(),"Data.Unit");
      
    test.done();
  },
    
  'Check namespace for expression explicit import': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.code("Data.Explicit"));      
    aPackages.define(aReader.code("Data.Unit"));      
      
    test.equal(aLinker.findExpressionNamespace("Data.Explicit","unit").success(),"Data.Unit");
      
    test.done();
  },
    
  'Check namespace for type implicit import': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.code("Data.Implicit"));      
    aPackages.define(aReader.code("Data.Unit"));      
      
    test.equal(aLinker.findTypeNamespace("Data.Implicit","unit").success(),"Data.Unit");
      
    test.done();
  },
    
  'Check namespace for expression implicit import': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.code("Data.Implicit"));      
    aPackages.define(aReader.code("Data.Unit"));      
      
    test.equal(aLinker.findExpressionNamespace("Data.Implicit","unit").success(),"Data.Unit");
      
    test.done();
  },

  'Check namespace for type non explicit import': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.code("Data.Explicit"));      
    aPackages.define(aReader.code("Data.Unit"));      
      
    test.ok(aLinker.findTypeNamespace("Data.Explicit","unit2").isFailure());
      
    test.done();
  },

  'Check namespace for expression non explicit import': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.code("Data.Explicit"));      
    aPackages.define(aReader.code("Data.Unit"));      
      
    test.ok(aLinker.findExpressionNamespace("Data.Explicit","unit2").isFailure());
      
    test.done();
  },
};