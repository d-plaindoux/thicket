/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';

    function Pair(first,second) {
        this._1 = first;
        this._2 = second;
    }
    
    return function(f,s) { return new Pair(f,s); };
}());