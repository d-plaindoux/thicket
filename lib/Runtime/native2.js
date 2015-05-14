/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function(runtime) {
    
    // ------------------------------
    // Public delta rule in internal
    // ------------------------------        

    runtime.native("internal.apply", 2, function(stack) {
        var name = stack.shift()[1][0];

        /* self */ stack.shift();

        if (runtime.delta.hasOwnProperty(name)) {
            stack.unshift(runtime.deltarules[name]);
        } else {
            throw new Error("no system definition for " + name);
        }
    });

    // ------------------------------
    // Generic
    // ------------------------------        

    runtime.native("generic.==", 4, function(stack){
        var vFalse = stack.shift(),
            vTrue = stack.shift(),
            v2 = stack.shift()[1][0],
            v1 = stack.shift()[1][0];

        if (v1 === v2) {
            stack.unshift(vTrue);
        } else {
            stack.unshift(vFalse);
        }
    });
    
};
 