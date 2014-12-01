/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.choice = function (choices) {
    
    'use strict';
    
    function Choice(choices) {
        this.choices = choices;
    }
    
    return new Choice(choices);
};
