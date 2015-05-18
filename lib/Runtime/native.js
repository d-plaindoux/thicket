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

    runtime.native0("internalClass.apply", 2, function(env) {
        var name = runtime.constant(env.pop());
        env.pop();
        
        if (runtime.delta.hasOwnProperty(name)) {
            return runtime.delta[name];
        } else {
            throw new Error("no system definition for " + JSON.stringify(name));
        }
    });

    // ------------------------------
    // Generic
    // ------------------------------        

    runtime.native("generic.==", 4, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop()),
            aTrue = env.pop(),
            aFalse = env.pop();
            
        if (v1 === v2) {
            return [ {RESULT:aTrue} ];
        } else {
            return [ {RESULT:aFalse} ];
        }
    });
    
    runtime.native("generic.<<", 4, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop()),
            aTrue = env.pop(),
            aFalse = env.pop();

            
        if (v1 < v2) {
            return [ {RESULT:aTrue} ];
        } else {
            return [ {RESULT:aFalse} ];
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
            aSome = env.pop(),
            aNone = env.pop(),
            // compute value
            number = Number(self);

        
        if (isNaN(number)) {
            return [{RESULT:aNone}];
        } else {
            return [{RESULT:aSome}, {IDENT:"number"}, {CONST:number}, {APPLY:1}, {APPLY:1}];
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

    runtime.native("number.%", 2, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());
            
        return [ {IDENT:"number"}, {CONST:v1 % v2}, {APPLY:1} ];
    });

    runtime.native("number.toString", 1, function(env) {
        var self = env.shift();
        
        return [ {IDENT:"string"}, {CONST:runtime.constant(self)+""}, {APPLY:1} ];
    });
         
    // ------------------------------
    // Array
    // ------------------------------

    runtime.native("array.new", 1, function(env) {
        var v1 = runtime.constant(env.pop());
        
        return [ {CONST:new Array(v1)} ];
    });

    runtime.native("array.set", 3, function(env){
        var self = runtime.constant(env.pop()),
            index = runtime.constant(env.pop()),
            value = env.pop();
        
        if (index <= -1 || self.length <= index) {
            return [ {CONST:self} ];
        } else {
            var nself = self.slice();
            nself[index] = value;
            return [ {CONST:nself} ];
        }
    });

    runtime.native("array.reset", 2, function(env){
        var self = runtime.constant(env.pop()),
            index = runtime.constant(env.pop());
        
        if (index <= -1 || self.length <= index) {
            return [ {CONST:self} ];
        } else {
            var nself = self.slice();
            delete nself[index];
            return [ {CONST:nself} ];
        }
    });

    runtime.native("array.get", 4, function(env){
        var self = runtime.constant(env.pop()),
            index = runtime.constant(env.pop()),
            aSome = env.pop(),
            aNone = env.pop();
        
        if (index <= -1 || self.length <= index) {
            return [ {RESULT:aNone} ];
        } else if (self[index]) {
            return [ {RESULT:aSome}, {RESULT:self[index]}, {APPLY:1} ];
        } else {
            return [ {RESULT:aNone} ];
        }
    });

    runtime.native("array.size", 1, function(env){
        var self = runtime.constant(env.pop());
        
        return [ {IDENT:"number"}, {CONST:self.length}, {APPLY:1} ];    
    });

};
 