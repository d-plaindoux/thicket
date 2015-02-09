/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports.commit = function (value) {
    
    'use strict';
    
    function Commit(value) {
        this.commit = value;
    }
    
    return new Commit(value);
};
    