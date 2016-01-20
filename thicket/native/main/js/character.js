
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
    // Character
    // ------------------------------        
    
    runtime.native("char.+", 2, function(env){
        var self = runtime.constant(env.pop()),
            index = runtime.constant(env.pop());
        
        return [[ $i.CONST, String.fromCharCode(self.charCodeAt(0) + index) ]];
    });

    runtime.native("char.toNumber", 1, function(env){
        var self = runtime.constant(env.pop());
        
        return [[ $i.CONST, self.charCodeAt(0) ]];
    });

};
 