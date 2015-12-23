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

};
 