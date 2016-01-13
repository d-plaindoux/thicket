/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function(runtime) {
    
    'use strict';

    var $i = runtime.instruction;

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

};
 