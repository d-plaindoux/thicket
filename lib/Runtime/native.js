/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function(runtime) {
    
    // ------------------------------
    // Public delta rule in internal
    // ------------------------------        

    runtime.native("internal.apply", 0, function(env) {
        console.log(runtime.pretty(env));        
        
        var name = runtime.constant(env.pop());
        
        env.pop();

        if (runtime.delta.hasOwnProperty(name)) {
            return runtime.delta[name].concat([{RETURN:1}]);;
        } else {
            throw new Error("no system definition for " + JSON.stringify(name));
        }
    });

    // ------------------------------
    // Generic
    // ------------------------------        

    runtime.native("generic.==", 4, function(env){
        console.log(runtime.pretty(env));
    
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());
            
        if (v1 === v2) {
            return [{ACCESS:0}];
        } else {
            return [{ACCESS:1}];
        }
    });
    
    runtime.native("generic.<<", 4, function(env){
    
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());
            
        if (v1 < v2) {
            return [{ACCESS:0}];
        } else {
            return [{ACCESS:1}];
        }
    });

    // ------------------------------
    // Number
    // ------------------------------        

    runtime.native("number.+", 2, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());
            
        return [ {IDENT:"number"}, {CONST:v1 + v2}, {APPLY:1} ];
    });

    runtime.native("number.-", 2, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());
            
        return [ {IDENT:"number"}, {CONST:v1 - v2}, {APPLY:1} ];
    });

    runtime.native("number.*", 2, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());
            
        return [ {IDENT:"number"}, {CONST:v1 * v2}, {APPLY:1} ];
    });

    runtime.native("number./", 2, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());
            
        return [ {IDENT:"number"}, {CONST:v1 / v2}, {APPLY:1} ];
    });

    runtime.native("number.toString", 1, function(env) {
        var self = runtime.constant(env.shift());
        
        return [ {IDENT:"string"}, {CONST:self+""}, {APPLY:1} ];
    });
    
};
 