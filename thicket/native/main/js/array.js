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
};
 