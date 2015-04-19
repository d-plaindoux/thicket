/*global JSON*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

/* QUICK AND DIRTY transpiler -- for validation purpose only */

module.exports = (function () {
    
    'use strict';
    
    function replacer(key,value)
    {
        if (key === "$location") {
            return undefined;
        }
        
        return value;
    }

    function compileDependency(dependency) {
        return JSON.stringify(dependency, replacer);
    }

    return {
        dependency: compileDependency
    };

}());