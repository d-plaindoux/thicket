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
    // Request
    // ------------------------------        

    runtime.native("xmlhttp.create", 1, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());

        return [[ $i.CONST, new XMLHttpRequest() ]];
    });

    runtime.native("xmlhttp.create", 1, function(env){
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop());

        return [[ $i.CONST, new XMLHttpRequest() ]];
    });

};
 