'use strict';

var stream = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/stream.js'),
    language = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/language.js')(),
    ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/ast.js');

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

exports['language_module'] = {
  setUp: function(done) {
    done();
  },
    
  'simple module is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("module Core.Bool model A"),
        aModule = ast.module("Core.Bool",[],[ast.entity("A",ast.model("A",[],[]))]);
        
    test.deepEqual(language.parser.group('module').parse(aStream).get(), 
                   aModule,
                   "accept an empty module");
    test.done();
  },    
    
  'simple module with explicit imports is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("module Core.Bool from Core.Test import a,b model A"),
        aModule = ast.module("Core.Bool",[ast.imports("Core.Test",["a","b"])],[ast.entity("A",ast.model("A",[],[]))]);
        
    test.deepEqual(language.parser.group('module').parse(aStream).get(), 
                   aModule,
                   "accept an empty module");
    test.done();
  },    
    
  'simple module with implicit imports is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("module Core.Bool from Core.Test import * model A"),
        aModule = ast.module("Core.Bool",[ast.imports("Core.Test",[])],[ast.entity("A",ast.model("A",[],[]))]);
        
    test.deepEqual(language.parser.group('module').parse(aStream).get(), 
                   aModule,
                   "accept an empty module");
    test.done();
  },    
};