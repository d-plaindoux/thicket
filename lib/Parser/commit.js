/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.commit = function (value) {
    
    'use strict';
    
    function Commit(value) {
        this.commit = value;
    }
    
    return new Commit(value);
};
    