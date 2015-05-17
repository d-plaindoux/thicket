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
        var name = runtime.constant(env.pop());
        
        env.pop();

        if (runtime.delta.hasOwnProperty(name)) {
            return runtime.delta[name].concat([{RETURN:1}]);
        } else {
            throw new Error("no system definition for " + JSON.stringify(name));
        }
    });

    // ------------------------------
    // Generic
    // ------------------------------        

    runtime.native("generic.==", 4, function(env){
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
    // String
    // ------------------------------        

    runtime.native("string.+", 2, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());
            
        return [ {IDENT:"string"}, {CONST:v1 + v2}, {APPLY:1} ];
    });
    
    runtime.native("string.toNumber", 3, function(env){
        var self = runtime.constant(env.pop()),
            number = Number(self);
        
        if (isNaN(number)) {
            return [{ACCESS:2}];
        } else {
            return [{ACCESS:1}, {IDENT:"number"}, {CONST:number}, {APPLY:1}, {APPLY:1}];
        }        
    });
    
    runtime.native("string.hash", 1, function(env) {
        var self = runtime.constant(env.pop()),
            hash = 0;  
            
        // cf. http://stackoverflow.com/questions/7616461/
        self.split('').forEach(function(c) {
            hash = (((hash << 5) - hash) + c.charCodeAt(0)) | 0;
        });

        return [{IDENT:"number"}, {CONST:hash}, {APPLY:1}];
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
        var self = runtime.constant(env.pop());
        
        return [ {IDENT:"string"}, {CONST:self+""}, {APPLY:1} ];
    });
    
};
 