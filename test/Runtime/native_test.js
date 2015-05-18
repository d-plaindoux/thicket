'use strict';

/*
var native = require('../../lib' + (process.env.THICKET_COV || '') + '/Runtime/native.js'),
    M = native(require('../../lib' + (process.env.THICKET_COV || '') + '/Runtime/runtime.js'));
*/

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

exports['native'] = {
  setUp: function(done) {
    done();
  },
/*    
  'numbers true comparison': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.delta["generic.=="](M.number(1))(M.number(1))(true)(false));
    test.done();
  },

  'numbers false comparison': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.delta["generic.=="](M.number(1))(M.number(2))(false)(true));
    test.done();
  },

  'strings true comparison': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.delta["generic.=="](M.string("1"))(M.string("1"))(true)(false));
    test.done();
  },

  'strings false comparison': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.delta["generic.=="](M.string("1"))(M.string("2"))(false)(true));
    test.done();
  },
    
  'numbers true <<': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.delta["generic.<<"](M.number(1))(M.number(2))(true)(false));
    test.done();
  },

  'numbers false <<': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.delta["generic.<<"](M.number(1))(M.number(1))(false)(true));
    test.done();
  },

  'strings true <<': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.delta["generic.<<"](M.string("1"))(M.string("2"))(true)(false));
    test.done();
  },

  'strings false <<': function(test) {
    test.expect(1);
    // tests here  
    test.ok(M.delta["generic.<<"](M.string("1"))(M.string("1"))(false)(true));
    test.done();
  },
    
  'strings catenation': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.delta["string.+"](M.string("1"))(M.string("1")), 
                   M.$$(M.string("11")));
    test.done();
  },
    
  'string toNumber': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.delta["string.toNumber"](M.string("1"))(function(n) { return n;})(M.number(-1)),
                   M.$$(M.number(1)));
    test.done();
  },
        
  'string wrong toNumber': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.delta["string.toNumber"](M.string("a1"))(function(n) { return n;})(M.string("Fail")),
                   M.$$(M.string("Fail")));
    test.done();
  },
        
  'strings hash': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.delta["string.hash"](M.string("1")),
                   M.$$(M.number(49)));
    test.done();
  },
   
  'numbers +': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.delta["number.+"](M.number(6))(M.number(2)),
                   M.$$(M.number(8)));
    test.done();
  },
   
  'numbers -': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.delta["number.-"](M.number(6))(M.number(2)),
                   M.$$(M.number(4)));
    test.done();
  },
   
  'numbers *': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.delta["number.*"](M.number(6))(M.number(2)),
                   M.$$(M.number(12)));
    test.done();
  },
   
  'numbers /': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.delta["number./"](M.number(6))(M.number(2)),
                   M.$$(M.number(3)));
    test.done();
  },
   
  'number toString': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.delta["number.toString"](M.number(6)),
                   M.$$(M.string("6")));
    test.done();
  },
     
  'array new': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.delta["array.new"](M.number(1)),
                   M.$$(new Array(1)));
    test.done();
  },
     
  'array set': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.delta["array.set"](M.number(new Array(2)))(M.number(1))(M.string("1")),
                   M.$$([, M.string("1")]));
    test.done();
  },

  'array set out of bound': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.delta["array.set"](M.number(new Array(1)))(M.number(1))(M.string("1")),
                   M.$$(new Array(1)));
    test.done();
  },

  'array reset': function(test) {
    test.expect(1);
    // tests here  
    var array = [ M.number(1) ];
    test.deepEqual(M.delta["array.reset"](M.number(array))(M.number(0)),
                   M.$$(new Array(1)));
    test.done();
  },

  'array reset out of bound': function(test) {
    test.expect(1);
    // tests here  
    var array = [ M.number(1) ];
    test.deepEqual(M.delta["array.reset"](M.number(array))(M.number(1)),
                   M.$$([ M.number(1) ]));
    test.done();
  },

  'array get': function(test) {
    test.expect(1);
    // tests here  
    var array = [ M.number(1) ];
    test.deepEqual(M.delta["array.get"](M.number(array))(M.number(0))(function (a) { return a; })(M.string("Fail")),
                   M.$$(M.number(1)));
    test.done();
  },

  'array get undefined': function(test) {
    test.expect(1);
    // tests here  
    var array = new Array(1);
    test.deepEqual(M.delta["array.get"](M.number(array))(M.number(0))(function (a) { return a; })(M.string("Fail")),
                   M.$$(M.string("Fail")));
    test.done();
  },

  'array get out of bound': function(test) {
    test.expect(1);
    // tests here  
    var array = [ M.number(1) ];
    test.deepEqual(M.delta["array.get"](M.number(array))(M.number(1))(function (a) { return a; })(M.string("Fail")),
                   M.$$(M.string("Fail")));
    test.done();
  },

  'array size': function(test) {
    test.expect(1);
    // tests here  
    test.deepEqual(M.delta["array.size"](M.number(new Array(10))),
                   M.$$(M.number(10)));
    test.done();
  },
*/  
};