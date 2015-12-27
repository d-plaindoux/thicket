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
    // Forall
    // ------------------------------
    
    runtime.native("range.fold", 6, function(env, measures) {
        var v1 = runtime.constant(env.pop()),
            v2 = runtime.constant(env.pop()),
            d  = runtime.constant(env.pop()),
            r = env.pop(),
            f = env.pop(),
            n = env.pop(),
            c = d < 0 ? function(i,s) {return i >= s; } 
                      : function(i,s) {return i <= s; };
        
        for(var i = v1; c(i,v2); i += d) {
            r = runtime.executeCode([
                [ $i.RESULT, f ], 
                [ $i.RESULT, r ],
                [ $i.APPLY ],
                [ $i.PUSH, [[ $i.RESULT, n ], [ $i.CONST, i ],[ $i.APPLY ]] ],
                [ $i.APPLY ],
            ], [], measures);
        }
        
        return [[ $i.RESULT, r ]];
    });    

};
 