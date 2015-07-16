/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';

    function get(object) {
        if (typeof(object) === 'object') {
            return object.constructor.toString(object).match(/^function\s(.*)\(/)[1];
        } else {
            return typeof(object);
        }
    }
    
    return {
        typeof : get
    };
}());