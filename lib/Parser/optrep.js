/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.optrep = function (optrep) {
    
    'use strict';
    
    function Optrep(optrep) {
        this.optrep = optrep;
    }
    
    return new Optrep(optrep);
};
    