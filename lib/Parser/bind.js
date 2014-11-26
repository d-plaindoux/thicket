/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.bind = function (value) {
    
    'use strict';
    
    function Bind(bind, value) {
        this.bind = bind;
        this.value = value;
    }
    
    Bind.prototype.toString = function () {
        return this.bind + " <- " + this.source;
    };
    
    return { to : function (bind) { return new Bind(bind, value); }};
};
    