/* global process */

/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function(runtime) {
    
    'use strict';

    // Not used var $i = runtime.instruction; 

    runtime.native("runtime.exit", 1, function(env) {
        var value = runtime.constant(env.pop());
        
        if (process) {
            return process.exit(value);
        } else {
            throw new Error("Process not available");
        }
    });
};