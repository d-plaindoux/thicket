/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports.rep = function (rep, sep) {
    
    'use strict';
    
    function Rep(rep, sep) {
        this.rep = rep;
        this.sep = sep;
    }
    
    return new Rep(rep, sep);
};
    