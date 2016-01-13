/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function (choices) {
    
    'use strict';
    
    function Choice(choices) {
        this.$t = "Choice";
        this.choices = choices;
    }
    
    return new Choice(choices);
};
