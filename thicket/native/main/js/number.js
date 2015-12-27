/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function(runtime) {
    
    'use strict';

    var $i = runtime.instruction;

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

    runtime.native("number.>>", 2, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());

        return [[ $i.CONST, v1 >> v2 ]];
    });

    runtime.native("number.|", 2, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());

        return [[ $i.CONST, v1 | v2 ]];
    });


    runtime.native("number.&", 2, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());

        return [[ $i.CONST, v1 & v2 ]];
    });

    runtime.native("number.toString", 1, function(env) {
        var v1 = runtime.constant(env.shift());
        
        return [[ $i.CONST, v1 + "" ]];
    });

};
 