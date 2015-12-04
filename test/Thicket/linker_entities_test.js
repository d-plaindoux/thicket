'use strict';

var stream = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/stream.js'),
    language = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/language.js')(),
    list = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/list.js'),
    pair = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/pair.js'),
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

exports['linker_entities'] = {
  setUp: function(done) {
    done();
  },

  'Link simple model': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);
      
    test.ok(aLinker.linkEntities(aPackages.main(), list(entities)).isSuccess());
      
    test.done();
  },
    
  'Link polymorphic model': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model Future[a] { _ : a }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list());
      
    test.done();
  },
    
  'Cannot link simple model': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number { _ : string }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkEntities(aPackages.main(), list(entities)).isFailure());
      
    test.done();
  },
    
  'Link simple typedef': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('typedef MyUnit = unit'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aReader = reader(fsdriver('./test/Thicket/samples')),
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.define(aReader.code("Data.Unit"));      

    test.deepEqual(aLinker.linkEntities("Data.Unit", list(entities)).success(),
                   list([ pair('Data.Unit', 'unit') ]));
      
    test.done();
  },
    
  'Cannot Link simple typedef': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('typedef MyUnit = unit'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkEntities("Data.Unit", list(entities)).isFailure());
      
    test.done();
  },
    
  'Link polymorphic typedef': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('typedef Function[a b] = a -> b'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list());
      
    test.done();
  },
    
  'Cannot Link polymorphic typedef': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('typedef Function[a] = a -> b'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkEntities(aPackages.main(), list(entities)).isFailure());
      
    test.done();
  },
    
  'Link simple expression': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('def apply = f a -> f a'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list());
      
    test.done();
  },
    
  'Permissive Link simple expression': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('def apply = f -> f a'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);  
      
    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list()); // May be 'a' is a method
      
    test.done();
  },
    
  'Link simple typed expression': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('def apply : [a b] (a -> b) -> a = f a -> f a'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list());
      
    test.done();
  },
    
  'Cannot Link simple typed expression': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('def apply : [a] (a -> b) -> a = f a -> f a'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkEntities(aPackages.main(), list(entities)).isFailure());
      
    test.done();
  },
   
  'Cannot Link abstract type': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('type A { model B } def apply : B = B'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);
    
    aPackages.defineInRoot([], entities);
      
    test.ok(aLinker.linkEntities(aPackages.main(), list(entities)).isFailure());
      
    test.done();
  },

  'Link concrete model': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('type A { model B } def apply = B'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list([pair("$","B")]));
      
    test.done();
  },
    
  'Cannot Link abstract model': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('type A { model B } def apply = A'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
      
    test.ok(aLinker.linkEntities(aPackages.main(), list(entities)).isFailure());
      
    test.done();
  },

  'Link polymorphic submodel': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('type A[a] { model B { _ : a } } def apply : [a] a -> A = B a'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list([pair("$","A"),pair("$","B")]));
      
    test.done();
  },

  'Link simple controller': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number class a this:number { f : number -> a } { def f n = a n }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list([pair("$","number"),pair("$","a")]));
      
    test.done();
  },

  'Link simple controller using self': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number class a this:number { f : number -> a } { def f n = self }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list([pair("$","number"),pair("$","a")]));
      
    test.done();
  },

  'Link simple controller using this': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number class a this:number { f : number -> a } { def f n = a this }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list([pair("$","number"),pair("$","a")]));
      
    test.done();
  },

  'Link simple controller using model selector': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model A class a this:A { f : A -> a } { def A.f n = a this }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list([pair("$","A"),pair("$","a")]));
      
    test.done();
  },

  'Cannot Link simple controller using wrong model selector': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model A class a this:A { f : A -> a } { def B.f n = a this }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.ok(aLinker.linkEntities(aPackages.main(), list(entities)).isFailure());
      
    test.done();
  },

  'Cannot Link controller with wrong type': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('class a this:number { f : number -> a } { def f n = a n }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.ok(aLinker.linkEntities(aPackages.main(), list(entities)).isFailure());
      
    test.done();
  },

  'Can Link controller with maybe wrong expression': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number class a this:number { f : number -> a } { def f n = a b }'), // May be a.b
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list([pair("$","number"),pair("$","a")]));
      
    test.done();
  },

  'Link simple by name': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number class a this:number { f : number -> a } { def f n = a this }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list([pair("$","number"),pair("$","a")]));
      
    test.done();
  },
    
  'Cannot Link unknown name': function(test) {
    test.expect(1);
    // tests here  
    var aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    test.ok(aLinker.linkPackageByName(aPackages.main()).isFailure());
      
    test.done();
  },

  'Cannot Link simple by name': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('class a this:number { f : number -> a } { def f n = a this }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.ok(aLinker.linkPackageByName(aPackages.main()).isFailure());
      
    test.done();
  },

  'Can Link controller with model derivation': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number model B class a this:number { with B } {  }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list([pair("$","number"),pair("$","B")]));
      
    test.done();
  },
    
  'Cannot Link controller with model derivation': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number class a this:number { with Foo } {  }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.ok(aLinker.linkPackageByName(aPackages.main()).isFailure());
      
    test.done();
  },
    
  'Trait definition': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('trait Foo {}{}'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
     test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list());
     
    test.done();
  },


  'Link simple trait': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number trait a { f : number -> number } { def f n = n }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list([pair("$","number")]));
      
    test.done();
  },

  'Link simple trait using self': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number trait a { f : number -> a } { def f n = self }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.ok(aLinker.linkEntities(aPackages.main(), list(entities)).isSuccess());
      
    test.done();
  },

  'Cannot Link trait with wrong type': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('trait a { f : number -> number } { def f n = n }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.ok(aLinker.linkEntities(aPackages.main(), list(entities)).isFailure());
      
    test.done();
  },
    
  'Cannot Link trait with wrong expression': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('trait a { f : number -> number } { def f n = a n }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.ok(aLinker.linkEntities(aPackages.main(), list(entities)).isFailure());
      
    test.done();
  },

  'Can Link trait with maybe wrong expression': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model number trait a { f : number -> number } { def f n = n b }'), // May be a.b
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list([pair("$","number")]));
      
    test.done();
  },

  'Can Link trait derivation': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('model B trait a { with B } {  }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.deepEqual(aLinker.linkEntities(aPackages.main(), list(entities)).success(),
                   list([pair("$","B")]));
      
    test.done();
  },
    
  'Cannot Link trait derivation': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream('trait a { with Foo } {  }'),
        entities = language.parser.group('entities').parse(aStream).get()[0],
        aPackages = packages(option.none()),
        aLinker = linker(aPackages);

    aPackages.defineInRoot([], entities);  
 
    test.ok(aLinker.linkPackageByName(aPackages.main()).isFailure());
      
    test.done();
  },
};