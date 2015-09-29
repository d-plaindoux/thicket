/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function(runtime) {
    
    var $i = runtime.instruction;
    
    // ------------------------------
    // Public delta rule in internal
    // ------------------------------        

    runtime.native0("internalClass.apply", 2, function(env) {
        var name = runtime.constant(env.pop()); // THIS
        env.pop();                              // SELF
        
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
            return [[ $i.RESULT, aTrue ]];
        } else {
            return [[ $i.RESULT, aFalse ]];
        }
    });
    
    runtime.native("generic.<", 4, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop()),
            aTrue = env.pop(),
            aFalse = env.pop();

            
        if (v1 < v2) {
            return [[ $i.RESULT, aTrue ]];
        } else {
            return [[ $i.RESULT, aFalse ]];
        }
    });

    // ------------------------------
    // String
    // ------------------------------        

    runtime.native("string.+", 2, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());
            
        return [[ $i.CONST, v1 + v2 ]];
    });

    runtime.native("string.length", 1, function(env){
        var v1 = runtime.constant(env.pop());
            
        return [[ $i.CONST, v1.length ]];
    });
    
    runtime.native("string.toNumber", 3, function(env){
        var self = runtime.constant(env.pop()),
            aSome = env.pop(),
            aNone = env.pop(),
            // compute value
            number = Number(self);

        
        if (isNaN(number)) {
            return [[ $i.RESULT, aNone ]];
        } else {
            return [[ $i.RESULT, aSome ], [ $i.CONST, number], [ $i.APPLY ]];
        }        
    });
    
    runtime.native("string.hash", 1, function(env) {
        var self = runtime.constant(env.pop()),
            hash = 0;  
            
        // cf. http://stackoverflow.com/questions/7616461/
        self.split('').forEach(function(c) {
            hash = (((hash << 5) - hash) + c.charCodeAt(0)) | 0;
        });

        return [[ $i.CONST, hash ]];
    });
    
    runtime.native("string.setAt", 3, function(env){
        var self = runtime.constant(env.pop()),
            index = runtime.constant(env.pop()),
            value = runtime.constant(env.pop()),
            result;

        if (index > -1 && index < self.length) {
            result = self.substr(0, index) + value + self.substr(index + value.length);
        } else {
            result = self;
        }
        
        return [[ $i.CONST, result ]];
    });

    runtime.native("string.<+", 2, function(env){
        var self = runtime.constant(env.pop()),
            index = runtime.constant(env.pop());
        
        return [[ $i.CONST, String.fromCharCode(self.charCodeAt(0) + index) ]];
    });

    runtime.native("string.getAt", 4, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop()),
            aSome = env.pop(),
            aNone = env.pop();

        if (-1 < v2 && v2 < v1.length) {
            return [[ $i.RESULT, aSome ], [ $i.CONST, v1[v2] ], [ $i.APPLY ]];
        } else {
            return [[ $i.RESULT, aNone ]];
        }        
        
        return [[ $i.CONST, v1 + v2 ]];
    });
    
    // ------------------------------
    // Number
    // ------------------------------        

    runtime.native("number.+", 2, function(env){        
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());
            
        return [[ $i.CONST, v1 + v2 ]];
    });

    runtime.native("number.-", 2, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());
            
        return [[ $i.CONST, v1 - v2 ]];
    });

    runtime.native("number.*", 2, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());
            
        return [[ $i.CONST, v1 * v2 ]];
    });

    runtime.native("number./", 2, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());
        
        if (v2 === 0) {
            return [[ $i.CONST, Infinity * v1 ]];
        } else {            
            return [[ $i.CONST, v1 / v2 ]];
        }
    });

    runtime.native("number.%", 2, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());

        if (v2 === 0) {
            return [[ $i.CONST, NaN ]];
        } else {            
            return [[ $i.CONST, v1 % v2 ]];
        }
    });

    runtime.native("number.<<", 2, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());

        return [[ $i.CONST, v1 << v2 ]];
    });

    runtime.native("number.toString", 1, function(env) {
        var v1 = runtime.constant(env.shift());
        
        return [[ $i.CONST, v1 + "" ]];
    });
         
    // ------------------------------
    // Array
    // ------------------------------

    runtime.native("array.new", 1, function(env) {
        var v1 = runtime.constant(env.pop());
        
        return [[ $i.CONST, new Array(v1) ]];
    });

    runtime.native("array.set", 3, function(env){
        var self = runtime.constant(env.pop()),
            index = runtime.constant(env.pop()),
            value = env.pop();
        
        if (index <= -1 || self.length <= index) {
            return [[ $i.CONST, self ]];
        } else {
            var nself = self.slice();
            nself[index] = value;
            return [[ $i.CONST, nself ]];
        }
    });

    runtime.native("array.reset", 2, function(env){
        var self = runtime.constant(env.pop()),
            index = runtime.constant(env.pop());
        
        if (index <= -1 || self.length <= index) {
            return [[ $i.CONST, self ]];
        } else {
            var nself = self.slice();
            delete nself[index];
            return [[ $i.CONST, nself ]];
        }
    });

    runtime.native("array.get", 4, function(env){
        var self = runtime.constant(env.pop()),
            index = runtime.constant(env.pop()),
            aSome = env.pop(),
            aNone = env.pop();
        
        if (index <= -1 || self.length <= index) {
            return [[ $i.RESULT, aNone ]];
        } else if (self[index]) {
            return [[ $i.RESULT, aSome ], [ $i.RESULT, self[index] ], [ $i.APPLY, 1 ]];
        } else {
            return [[ $i.RESULT, aNone ]];
        }
    });

    runtime.native("array.size", 1, function(env){
        var self = runtime.constant(env.pop());
        
        return [[ $i.CONST, self.length ]];    
    });
    
    // ------------------------------
    // Console
    // ------------------------------
    
    runtime.native("console.log", 2, function(env) {
        var v1 = runtime.constant(env.pop()),
            self = env.pop();
        
        console.log(v1);
        
        return [[ $i.RESULT, self ]];
    });

    
    // ------------------------------
    // Mutable
    // ------------------------------
    
    runtime.native("mutable.new", 1, function(env) {
        var value = env.pop(),
            /* Create cell */
            cell = { value : value };
        
        return [[ $i.CONST, cell ]];
    });

    runtime.native("mutable.set", 2, function(env) {
        var self = runtime.constant(env.pop()),
            value = env.pop();            
        
        self.value = value;
        
        return [[ $i.CONST, self ]];
    });

    runtime.native("mutable.get", 1, function(env) {
        var self = runtime.constant(env.pop());
        
        return [[ $i.RESULT, self.value ]];
    });

};
 