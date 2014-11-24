/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.bind = function (value) {
    
    'use strict';
    
    function Bind(name, value) {
        this.name = name;
        this.value = value;
    }
    
    Bind.prototype.toString = function () {
        return this.name + " <- " + this.source;
    };
    
    return { to : function (name) { return new Bind(name, value); }};
};
    