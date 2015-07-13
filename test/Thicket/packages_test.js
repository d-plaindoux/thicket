/*jshint -W061 */

'use strict';

var option = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/option.js'),
    fsdriver = require('../../lib' + (process.env.THICKET_COV || '') + '/Resource/drivers/fsdriver.js'),
    reader = require('../../lib' + (process.env.THICKET_COV || '') + '/Resource/reader.js'),
    packages = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/Data/packages.js');

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
    var // aReader = reader(fsdriver('./test/Resource/samples')),
        aPackages = packages(option.none());

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

    aPackages.define("Data.Unit", aReader.specifications("Data.Unit"));      
    test.equal(aPackages.list().size(), 1);
      
    test.done();
  },

  'Retrieve a given package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define("Data.Unit", aReader.specifications("Data.Unit"));      
      
    test.ok(aPackages.retrieve("Data.Unit").isPresent());
      
    test.done();
  },
    
  'Retrieve a given type from package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define("Data.Unit", aReader.specifications("Data.Unit"));      
      
    test.ok(aPackages.retrieve("Data.Unit").get().findType("unit").isSuccess());
      
    test.done();
  },
    
  'Do not retrieve a given type from package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define("Data.Unit", aReader.specifications("Data.Unit"));      
      
    test.ok(aPackages.retrieve("Data.Unit").get().findType("wrongName").isFailure());
      
    test.done();
  },
    
  'Retrieve a given expression from package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define("Data.Unit", aReader.specifications("Data.Unit"));      
      
    test.ok(aPackages.retrieve("Data.Unit").get().findExpression("unit").isSuccess());
      
    test.done();
  },
    
  'Do not retrieve a given expression from package': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none());

    aPackages.define("Data.Unit", aReader.specifications("Data.Unit"));      
      
    test.ok(aPackages.retrieve("Data.Unit").get().findExpression("wrongName").isFailure());
      
    test.done();
  },

};
