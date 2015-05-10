/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    return function (data, reason) {
        if (data.$location) {
            return new Error(reason + " at " + data.$location);
        } else {
            return new Error(reason);
        }
    };
}());