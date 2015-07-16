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

  'Read specifications': function(test) {
    test.expect(1);
    // tests here  
    var aReader = reader(fsdriver('./test/Resource/samples')); 
        
    test.deepEqual(aReader.specifications("Data.Boolean"), [
        { '$type': 'Model',
           name: 'True',
           variables: [],
           params: [],
           parent: 
        { '$type': 'Model',
          name: 'Bool',
          variables: [],
          params: [],
          abstract: true } },
        { '$type': 'Model',
          name: 'False',
          variables: [],
          params: [],
          parent: 
        { '$type': 'Model',
          name: 'Bool',
          variables: [],
          params: [],
          abstract: true } },
        { '$type': 'Model',
           name: 'Bool',
           variables: [],
           params: [],
           abstract: true }        
        ]);
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
};
