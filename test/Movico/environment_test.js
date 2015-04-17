'use strict';

var atry = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/atry.js'),
    ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/syntax/ast.js'),
    dependencies = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/symbol/dependencies.js'),
    environments = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/symbol/environment.js');


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

exports['environment'] = {
  setUp: function(done) {
      done();
  },

  'Environment empty first when created': function (test) {
      test.expect(1);
      var environment = environments(dependencies(null));
      test.equal(environment.isDefined("true"), false);
      test.done();
  },  

  'Environment resolve an import': function (test) {
      test.expect(1);
      var entities = [ast.model("bool",[],[])],
          environment = environments(dependencies(function(){ return atry.success(entities); }));
      
      test.deepEqual(environment.importFromModule(ast.imports(["Core","Bool"], ["bool"])).success().value, 
                     entities);
      test.done();
  },  

  'Environment partial resolve an import': function (test) {
      test.expect(1);
      var entities = [ast.model("bool",[],[]), ast.model("loob",[],[])],
          environment = environments(dependencies(function(){ return atry.success(entities); }));
      
      test.deepEqual(environment.importFromModule(ast.imports(["Core","Bool"], ["bool"])).success().value, 
                     [ast.model("bool",[],[])]);
      test.done();
  },  

  'Environment total resolve an import': function (test) {
      test.expect(1);
      var entities = [ast.model("bool",[],[]), ast.model("loob",[],[])],
          environment = environments(dependencies(function(){ return atry.success(entities); }));
      
      test.deepEqual(environment.importFromModule(ast.imports(["Core","Bool"], [])).success().value, 
                     entities);
      test.done();
  },  

  'Environment cannot resolve an import': function (test) {
      test.expect(1);
      var entities = [ast.model("bool",[],[])],
          environment = environments(dependencies(function(){ return atry.success(entities); }));
      
      test.ok(environment.importFromModule(ast.imports(["Core","Bool"], [ "loob" ])).isFailure());
      test.done();
  },  
    
  'Environment do not retrieve an entity': function (test) {
      test.expect(1);
      var entities = [ast.model("bool",[],[])],
          environment = environments(dependencies(function(){ return atry.success(entities); }));
      
      test.equal(environment.retrieve("bool").isPresent(), false);
      test.done();
  },  
    

  'Environment retreive symbol after resolve an import': function (test) {
      test.expect(1);
      var entities = [ast.model("bool",[],[])],
          environment = environments(dependencies(function(){ return atry.success(entities); }));
      
      environment.importFromModule(ast.imports(["Core","Bool"], ["bool"]));
            
      test.deepEqual(environment.retrieve("bool").get(), ast.model("bool",[],[]));
      test.done();
  },      
};
