'use strict';

var stream = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/stream.js'),
    language = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/language.js')(),
    list = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/list.js'),
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

exports['linker_type'] = {
  setUp: function(done) {
    done();
  },
    
  'Link local package type': function(test) {
    test.expect(2);
    // tests here  
    var aStream = stream('unit'),
        aType = language.parser.group('types').parse(aStream).get(),
        aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.specifications("Data.Unit"));      

    test.ok(aLinker.linkType("Data.Unit", aType, list()).isSuccess());
    test.deepEqual(aType,
                   { '$t': 'TypeVariable', name: 'unit', namespace: 'Data.Unit' });
      
    test.done();
  },      
    
  'Link imported type': function(test) {
    test.expect(2);
    // tests here  
    var aStream = stream('unit'),
        aType = language.parser.group('types').parse(aStream).get(),
        aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.specifications("Data.Implicit"));      
    aPackages.define(aReader.specifications("Data.Unit"));      

    test.ok(aLinker.linkType("Data.Implicit", aType, list()).isSuccess());
    test.deepEqual(aType,
                   { '$t': 'TypeVariable', name: 'unit', namespace: 'Data.Unit' });
      
    test.done();
  },      
    
  'Unlink Link Simple type': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('number'),
        aType = language.parser.group('types').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkType(aPackages.main(), aType, list()).isFailure());
      
    test.done();
  },      
    
  'Link type specialization': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('a[b]'),
        aType = language.parser.group('types').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkType(aPackages.main(), aType, list("a", "b")).isSuccess());
      
    test.done();
  },
    
  'Cannot Link parameter type specialization': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('a[b c]'),
        aType = language.parser.group('types').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkType(aPackages.main(), aType, list("a", "b")).isFailure());
      
    test.done();
  },
    
  'Cannot Link polymorphic type specialization': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('a[b]'),
        aType = language.parser.group('types').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkType(aPackages.main(), aType, list("b")).isFailure());
      
    test.done();
  },
      
  'Link type function': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('a -> b'),
        aType = language.parser.group('types').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkType(aPackages.main(), aType, list("a", "b")).isSuccess());
      
    test.done();
  },
      
  'Cannot Link argument type function': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('a -> b'),
        aType = language.parser.group('types').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkType(aPackages.main(), aType, list("b")).isFailure());
      
    test.done();
  },
      
  'Cannot Link result type function': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('a -> b'),
        aType = language.parser.group('types').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkType(aPackages.main(), aType, list("a")).isFailure());
      
    test.done();
  },
};