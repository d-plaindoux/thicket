/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function (optrep) {
    
    'use strict';
    
    function Optrep(optrep) {
        this.optrep = optrep;
    }
    
    return new Optrep(optrep);
};
    