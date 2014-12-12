/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.pair = (function () {
    
    'use strict';

    function Pair(first,second) {
        this._1 = first;
        this._2 = second;
    }

    Pair.prototype.toString = function () {
        return "(" + this._1 + ", " + this._2 + ")";
    };
    
    return function(f,s) { return new Pair(f,s); };
}());