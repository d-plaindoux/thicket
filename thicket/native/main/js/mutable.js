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
 