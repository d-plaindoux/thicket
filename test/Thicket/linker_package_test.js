'use strict';

var stream = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/stream.js'),
    language = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/language.js')(),
    option = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/option.js'),
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

exports['linker_package'] = {
  setUp: function(done) {
    done();
  },
    
  'Link Empty Package': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("module Test"),
        aPackage = language.parser.group('module').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aPackage);  
      
    test.ok(aLinker.linkPackage(aPackages.retrieve('Test').get()).isSuccess());
      
    test.done();
  },          

  'Link Package with a simple model': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("module Test model MyUnit"),
        aPackage = language.parser.group('module').parse(aStream).get(),
        aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.code("Data.Unit"));      
    aPackages.define(aPackage);  
      
    test.ok(aLinker.linkPackage(aPackages.retrieve('Test').get()).isSuccess());
      
    test.done();
  },          

  'Link Package with a model and an import': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("module Test from Data.Unit import unit model MyUnit { _ : unit }"),
        aPackage = language.parser.group('module').parse(aStream).get(),
        aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.code("Data.Unit"));      
    aPackages.define(aPackage);  
      
    test.ok(aLinker.linkPackage(aPackages.retrieve('Test').get()).isSuccess());
      
    test.done();
  },          

  'Cannot Link Package with a model and a missing import': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("module Test model MyUnit { _ : unit }"),
        aPackage = language.parser.group('module').parse(aStream).get(),
        aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.code("Data.Unit"));      
    aPackages.define(aPackage);  
      
    test.ok(aLinker.linkPackage(aPackages.retrieve('Test').get()).isFailure());
      
    test.done();
  },  
};