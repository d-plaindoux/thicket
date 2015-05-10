/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function (value) {
    
    'use strict';
    
    function Commit(value) {
        this.commit = value;
    }
    
    return new Commit(value);
};
    