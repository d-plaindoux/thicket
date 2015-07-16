'use strict';

var entities = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/checker/entities.js'),
    ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/ast.js'),
    option = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/option.js'),
    packages = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/packages.js'),
    environment = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/data/environment.js');    

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
    test.(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['entities_analyse'] = {
  setUp: function(done) {
      done();
  },

  "Analyse empty controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],ast.param("this",ast.namespace(ast.type.variable("number"),"Data.Number")),[],[])),
          aPackages = packages(option.none());      
      
      aPackages.define(ast.module("Data.Number",[],[ast.entity("number",ast.model("number",[],[]))]));      
      
      test.ok(entities.analyse(environment(aPackages), [aController]).isSuccess(),
              "Empty controller");
      test.done();
  },
    
  "Analyse simple controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],
                                       ast.param("this",ast.namespace(ast.type.variable("number"),"Data.Number")),
                                       [ ast.param("m", ast.namespace(ast.type.variable("number"),"Data.Number")) ],
                                       [ ast.method("m", ast.expr.number(1)) ])),
          aPackages = packages(option.none());      
      
      aPackages.define(ast.module("Data.Number",[],[ast.entity("number",ast.model("number",[],[]))]));
      
      test.ok(entities.analyse(environment(aPackages), [aController]).isSuccess(),
              "Simple controller");
      test.done();
  },

  "Analyse simple wrong controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],
                                       ast.param("this",ast.namespace(ast.type.variable("number"),"Data.Number")),
                                       [ ast.param("m", ast.namespace(ast.type.variable("string"),"Data.String")) ],
                                       [ ast.method("m", ast.expr.number(1)) ])),
          aPackages = packages(option.none());      
      
      aPackages.define(ast.module("Data.Number",[],[ast.entity("number",ast.model("number",[],[]))]));
      aPackages.define(ast.module("Data.String",[],[ast.entity("string",ast.model("string",[],[]))]));

      test.ok(entities.analyse(environment(aPackages),
                               [aController]).isFailure(),
              "Simple wrong controller");
      test.done();
  },
    
  "Analyse simple partial controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],
                                       ast.param("this",ast.namespace(ast.type.variable("number"),"Data.Number")),
                                       [ ],
                                       [ ast.method("m", ast.expr.number(1)) ])),
          aPackages = packages(option.none());      
      
      aPackages.define(ast.module("Data.Number",[],[ast.entity("number", ast.model("number",[],[]))]));
      
      test.ok(entities.analyse(environment(aPackages), [aController]).isFailure(),
              "Simple partial controller");
      test.done();
  },
    
  "Analyse simple controller using this": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],
                                       ast.param("this", ast.namespace(ast.type.variable("number"),"Data.Number")),
                                       [ ast.param("m", ast.namespace(ast.type.variable("number"),"Data.Number")) ],
                                       [ ast.method("m", ast.expr.ident("this")) ])),
          aPackages = packages(option.none());        
      
      aPackages.define(ast.module("Data.Number",[],[ast.entity("number", ast.model("number",[],[]))]));

      test.ok(entities.analyse(environment(aPackages), [aController]).isSuccess(),
              "This referencing controller");
      test.done();
  },
    
  "Cannot Analyse simple controller using this": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],
                                       ast.param("this", ast.namespace(ast.type.variable("number"),"Data.Number")),
                                       [ ast.param("m", ast.namespace(ast.type.variable("string"),"Data.String")) ],
                                       [ ast.method("m", ast.expr.ident("this")) ])),
          aPackages = packages(option.none());        
      
      aPackages.define(ast.module("Data.Number",[],[ast.entity("number", ast.model("number",[],[]))]));

      test.ok(entities.analyse(environment(aPackages), [aController]).isFailure(),
              "This referencing controller");
      test.done();
  },
    
  "Analyse simple controller using self": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],
                                       ast.param("this", ast.namespace(ast.type.variable("number"),"Data.Number")),
                                       [ ast.param("m", ast.namespace(ast.type.variable("number"),"Data.Number")) ],
                                       [ ast.method("m", ast.expr.invoke(ast.expr.ident("self"), "m")) ])),
                    aPackages = packages(option.none());        
      
      aPackages.define(ast.module("Data.Number",[],[ast.entity("number", ast.model("number",[],[]))]));

      test.ok(entities.analyse(environment(aPackages), [aController]).isSuccess(),
              "Self referencing controller");
      test.done();
  },
    
  "Analyse simple controller returning self": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],
                                       ast.param("this", ast.namespace(ast.type.variable("number"),"Data.Number")),
                                       [ ast.param("m", ast.namespace(ast.type.variable("A"),"Test")) ],
                                       [ ast.method("m", ast.expr.ident("self")) ])),
                    aPackages = packages(option.none());        
      
      aPackages.define(ast.module("Data.Number",[],[ast.entity("number", ast.model("number",[],[]))]));
      aPackages.define(ast.module("Test",[],[aController]));

      test.ok(entities.analyse(environment(aPackages), [aController]).isSuccess(),
              "Self referencing controller");
      test.done();
  },
    
  "Cannot Analyse simple controller returning self": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],
                                       ast.param("this", ast.namespace(ast.type.variable("number"),"Data.Number")),
                                       [ ast.param("m", ast.namespace(ast.type.variable("number"),"Data.Number")) ],
                                       [ ast.method("m", ast.expr.ident("self")) ])),
                    aPackages = packages(option.none());        
      
      aPackages.define(ast.module("Data.Number",[],[ast.entity("number", ast.model("number",[],[]))]));
      aPackages.define(ast.module("Test",[],[aController]));

      test.ok(entities.analyse(environment(aPackages), [aController]).isFailure(),
              "Self referencing controller");
      test.done();
  },
};
