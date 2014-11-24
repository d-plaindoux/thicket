/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.opt = function (opt) {
    
    'use strict';
    
    function Opt(opt) {
        this.opt = opt;
    }
    
    Rep.prototype.toString = function () {
        return this.value + "?";
    };
    
    return new Opt(opt);
};
    