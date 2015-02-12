/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function (opt) {
    
    'use strict';
    
    function Opt(opt) {
        this.opt = opt;
    }
    
    return new Opt(opt);
};
    