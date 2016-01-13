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
    // Console
    // ------------------------------
    
    runtime.native("console.log", 2, function(env) {
        var v1 = runtime.constant(env.pop()),
            self = env.pop();
        
        console.log(v1);
        
        return [[ $i.RESULT, self ]];
    });

};
 