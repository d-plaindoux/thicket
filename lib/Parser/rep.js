/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.rep = function (rep) {
    
    'use strict';
    
    function Rep(rep) {
        this.rep = rep;
    }
    
    return new Rep(rep);
};
    