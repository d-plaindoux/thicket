/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';

    function get(object) {
        if (object) {
            if (typeof(object) === 'object') {
                return object.constructor.toString(object).match(/^function\s(.*)\(/)[1];
            } else {
                return typeof(object);
            }
        }
        
        throw new Error("Cannot get type for null value");
    }
    
    return {
        typeof : get
    };
}());