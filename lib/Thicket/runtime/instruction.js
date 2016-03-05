/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    "use strict";
    
    var code = { 
        // Basic instructions
        CONST : 1,
        IDENT : 2,
        ACCESS : 3,
        
        APPLY : 4,
        TAILAPPLY : 5,

        INVOKE : 6,
        TAILINVOKE : 7,

        CLOSURE : 8,
        PUSH : 9,
        GRAB : 10,

        MODEL : 11,
        CLASS : 12,
        DEFINITION : 13,
        
        ALTER : 14,

        RETURN : 15,
        
        // Result instructions
        RESULT : 16,
        
        OBJ : 17,
        ENV : 18,
        
        DEFERRED : 19,
        
        NATIVE : 20,
        
        // Intermediate instructions
        CACHED : 21
    };
    
    return { 
        code : code,
        toString : function (n) {
            for(var key in code) {
                if (code[key] === n) {
                    return key;
                }
            }
            
            return "unknow(" + n +")";
        }        
    };

}());
