/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    "use strict";
    
    return { 
        CONST : 1,
        IDENT : 2,
        ACCESS : 3,
        APPLY : 4,
        INVOKE : 5,
        CLOSURE : 6,
        PUSH : 7,
        MODEL : 8,
        CLASS : 9,
        DEFINITION : 10,
        ALTER : 11,
        TAILAPPLY : 12,
        TAILINVOKE : 13,
        RETURN : 14,
        // Additional 
        RESULT : 15,
        OBJ : 16,
        ENV : 17,
        CACHED : 18,
        NATIVE : 19,
        R_NATIVE : 20,
        R_MODEL : 21,
        R_CLASS : 22,
        R_ANYINVOKE : 23,
        R_CACHED : 24,
        R_ANYAPPLY : 25,
        R_ALTER : 26,
        R_RETURN : 27
    };

}());
