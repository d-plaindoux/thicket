'use strict';

var stream = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/stream.js'),
    language = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/language.js')(),
    list = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/list.js'),
    option = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/option.js'),
    fsdriver = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/resource/drivers/fsdriver.js'),
    reader = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/resource/reader.js'),
    packages = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/packages.js'),
    linker = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/checker/linker.js');
    
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

exports['linker_entities'] = {
  setUp: function(done) {
    done();
  },

  'Link simple model': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkEntities("_", list(entities)).isSuccess());
      
    test.done();
  },
    
  'Link polymorphic model': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model Future[a] { _ : a }'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkEntities("_", list(entities)).isSuccess());
      
    test.done();
  },
    
  'Cannot link simple model': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number { _ : string }'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkEntities("_", list(entities)).isFailure());
      
    test.done();
  },
    
  'Link simple typedef': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('typedef MyUnit = unit'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.specifications("Data.Unit"));      

    test.ok(aLinker.linkEntities("Data.Unit", list(entities)).isSuccess());
      
    test.done();
  },
    
  'Cannot Link simple typedef': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('typedef MyUnit = unit'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkEntities("Data.Unit", list(entities)).isFailure());
      
    test.done();
  },
    
  'Link polymorphic typedef': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('typedef Function[a b] = a -> b'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkEntities("_", list(entities)).isSuccess());
      
    test.done();
  },
    
  'Cannot Link polymorphic typedef': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('typedef Function[a] = a -> b'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkEntities("_", list(entities)).isFailure());
      
    test.done();
  },
    
  'Link simple expression': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('def apply = f a -> f a'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkEntities("_", list(entities)).isSuccess());
      
    test.done();
  },
    
  'Permissive Link simple expression': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('def apply = f -> f a'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);  
      
    test.ok(aLinker.linkEntities("_", list(entities)).isSuccess()); // May be 'a' is a method
      
    test.done();
  },
    
  'Link simple typed expression': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('def apply : [a b] (a -> b) -> a = f a -> f a'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkEntities("_", list(entities)).isSuccess());
      
    test.done();
  },
    
  'Cannot Link simple typed expression': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('def apply : [a] (a -> b) -> a = f a -> f a'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkEntities("_", list(entities)).isFailure());
      
    test.done();
  },
   
  'Cannot Link abstract type': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('type A { model B } def apply : B = B'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);
      
    aPackages.defineInRoot(entities);
      
    test.ok(aLinker.linkEntities("_", list(entities)).isFailure());
      
    test.done();
  },

  'Link concrete model': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('type A { model B } def apply = B'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot(entities);  
 
    test.ok(aLinker.linkEntities("_", list(entities)).isSuccess());
      
    test.done();
  },
    
  'Cannot Link abstract model': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('type A { model B } def apply = A'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot(entities);  
      
    test.ok(aLinker.linkEntities("_", list(entities)).isFailure());
      
    test.done();
  },

  'Link polymorphic submodel': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('type A[a] { model B { _ : a } } def apply : [a] a -> A = B a'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot(entities);  
 
    test.ok(aLinker.linkEntities("_", list(entities)).isSuccess());
      
    test.done();
  },

  'Link simple controller': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number class a this:number { f : number -> a } { def f n = a n }'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot(entities);  
 
    test.ok(aLinker.linkEntities("_", list(entities)).isSuccess());
      
    test.done();
  },

  'Link simple controller using self': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number class a this:number { f : number -> a } { def f n = self }'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot(entities);  
 
    test.ok(aLinker.linkEntities("_", list(entities)).isSuccess());
      
    test.done();
  },

  'Link simple controller using this': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number class a this:number { f : number -> a } { def f n = a this }'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot(entities);  
 
    test.ok(aLinker.linkEntities("_", list(entities)).isSuccess());
      
    test.done();
  },

  'Cannot Link controller with wrong type': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('class a this:number { f : number -> a } { def f n = a n }'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot(entities);  
 
    test.ok(aLinker.linkEntities("_", list(entities)).isFailure());
      
    test.done();
  },

  'Cannot Link controller with wrong expression': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('class a this:number { f : number -> a } { def f n = a b }'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot(entities);  
 
    test.ok(aLinker.linkEntities("_", list(entities)).isFailure());
      
    test.done();
  },

  'Link simple by name': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number class a this:number { f : number -> a } { def f n = a this }'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot(entities);  
 
    test.ok(aLinker.linkPackageByName("_").isSuccess());
      
    test.done();
  },
    
  'Cannot Link unknown name': function(test) {
    test.expect(1);
    // tests here  
    var aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkPackageByName("_").isFailure());
      
    test.done();
  },

  'Cannot Link simple by name': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('class a this:number { f : number -> a } { def f n = a this }'),
        entities = language.parser.group('entities').parse(aStream).get(),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot(entities);  
 
    test.ok(aLinker.linkPackageByName("_").isFailure());
      
    test.done();
  },
};