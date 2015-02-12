/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function (choices) {
    
    'use strict';
    
    function Choice(choices) {
        this.choices = choices;
    }
    
    return new Choice(choices);
};
