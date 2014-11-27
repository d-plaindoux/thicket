/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.type = (function () {
    
    'use strict';

    function getType(object) {
        if (typeof(object) === 'object') {
            return object.constructor.toString(object).match(/^function\s(.*)\(/)[1];
        } else {
            return typeof(object);
        }
    }
    
    function isaType(object, name) {
        return getType(object) === name;
    }
    
    return {
        get : getType,        
        isa : isaType
    };
}());