/*jshint -W061 */

'use strict';

var fsdriver = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/resource/drivers/fsdriver.js'),
    reader = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/resource/reader.js');

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

exports['reader'] = {
  setUp: function(done) {
    done();
  },
    
  'Read specification': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Resource/samples')); 
        
    test.deepEqual(aReader.specification("Data.Boolean"), 
                   [{"MODEL":["boolean",["_","Boolean"]]}]);
    test.done();
  },
    
  'Read code': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Resource/samples')); 
        
    test.deepEqual(aReader.code("Data.Boolean"), 
                   [{"MODEL":["boolean",[["_",[{"ACCESS":1}]]]]},{"RETURN":1}]);
    test.done();
  },
    
  'Read package specification': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Resource/samples')); 
        
    test.deepEqual(aReader.packageSpecificationAndCode("Client").definition, 
               { name: 'Client',
                 version: '1.0',
                 description: 'Client package',
                 modules: 
                 [ ],
                 requires: [ { Core: '1.0' } ] });
    test.done();
  },
      
  'Read package code': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Resource/samples')); 
        
    test.deepEqual(aReader.packageCode("Client").definition, 
               { name: 'Client',
                 version: '1.0',
                 description: 'Client package',
                 modules: 
                 [ ],
                 requires: [ { Core: '1.0' } ] });
    test.done();
  },
      
  'Read and add package specification': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Resource/samples')); 
        
    aReader.addPackageCode(aReader.packageSpecificationAndCode("Client"));
      
    test.ok(aReader.hasPackage("Client"));
    test.done();
  },
    
  'Read and add required package specification': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Resource/samples')); 
        
    aReader.addPackageSpecificationAndCode(aReader.packageSpecificationAndCode("Client"));
      
    test.ok(aReader.hasPackage("Core"));
    test.done();
  },
      
  'Read and add package code': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Resource/samples')); 
        
    aReader.addPackageCode(aReader.packageCode("Client"));
      
    test.ok(aReader.hasPackage("Client"));
    test.done();
  },
    
  'Read and add required package code': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Resource/samples')); 
        
    aReader.addPackageCode(aReader.packageCode("Client"));
      
    test.ok(aReader.hasPackage("Core"));
    test.done();
  },
};
