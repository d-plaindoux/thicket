/*jshint -W061 */

'use strict';

var option = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/option.js'),
    fsdriver = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/resource/drivers/fsdriver.js'),
    symbols = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/symbols.js'),
    reader = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/resource/reader.js'),
    packages = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/packages.js');

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

exports['packages'] = {
  setUp: function(done) {
    done();
  },

  'Empty packages': function(test) {
    test.expect(1);
    // tests here  
    var aPackages = packages(option.none());

    test.equal(aPackages.list().size(), 0);
      
    test.done();
  },

  'Do not retrieve a given package': function(test) {
    test.expect(1);
    // tests here  
    var aPackages = packages(option.none());

    test.ok(!aPackages.retrieve("Data.Unit").isPresent());
      
    test.done();
  },
    
  'One package loaded': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define(aReader.code("Data.Unit"));      
    test.equal(aPackages.list().size(), 1);
      
    test.done();
  },

  'Retrieve a given package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define(aReader.code("Data.Unit"));      
      
    test.ok(aPackages.retrieve("Data.Unit").isPresent());
      
    test.done();
  },
 
  'Retrieve a given package 2': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define(aReader.code("Data.Implicit"));      
      
    test.ok(aPackages.retrieve("Data.Implicit").isPresent());
      
    test.done();
  },
 
  'Retrieve a given package 3': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define(aReader.code("Data.Explicit"));      
      
    test.ok(aPackages.retrieve("Data.Explicit").isPresent());
      
    test.done();
  },
    
  'Retrieve a given type from package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define(aReader.code("Data.Unit"));      
      
    test.ok(aPackages.retrieve("Data.Unit").get().findType("unit",{}).isSuccess());
      
    test.done();
  },
    
  'Do not retrieve a given type from package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define(aReader.code("Data.Unit"));      
      
    test.ok(aPackages.retrieve("Data.Unit").get().findType("wrongName",{}).isFailure());
      
    test.done();
  },
    
  'Retrieve a given expression from package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define(aReader.code("Data.Unit"));      
      
    test.ok(aPackages.retrieve("Data.Unit").get().findExpression("unit").isSuccess());
      
    test.done();
  },
    
  'Do not retrieve a given expression from package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define(aReader.code("Data.Unit"));      
      
    test.ok(aPackages.retrieve("Data.Unit").get().findExpression("wrongName").isFailure());
      
    test.done();
  },
    
  'Retrieve a given model expression from package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define(aReader.code("Data.Unit"));      
      
    test.deepEqual(aPackages.retrieve("Data.Unit").get().findExpression("unit").success(), 
                  { 
                    '$t': symbols.Model,
                    name: 'unit',
                    variables: [],
                    params: []
                  });
      
    test.done();
  },
    
  'Validate the namespace for a given model type in a package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define(aReader.code("Data.Unit"));      
      
    test.ok(aPackages.retrieve("Data.Unit").get().containsType("unit"));
      
    test.done();
  },
    
  'Validate the namespace for a given model expression in a package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define(aReader.code("Data.Unit"));      
      
    test.ok(aPackages.retrieve("Data.Unit").get().containsExpression("unit"));
      
    test.done();
  },
    
  'Do not validate the namespace for a given model expression not in a package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define(aReader.code("Data.Unit"));      
      
    test.ok(!aPackages.retrieve("Data.Unit").get().containsType("wrongUnit"));
      
    test.done();
  },
    
  'Find all adapters in a package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define(aReader.code("Data.Number"));      
      
    test.equal(aPackages.retrieve("Data.Number").get().adapters().size(), 3);
      
    test.done();
  },

};
