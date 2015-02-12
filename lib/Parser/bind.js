/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function (value) {
    
    'use strict';
    
    function Bind(bind, value) {
        this.bind = bind;
        this.value = value;
    }
    
    return { to : function (bind) { return new Bind(bind, value); }};
};
    