/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function (rep, sep) {
    
    'use strict';
    
    function Rep(rep, sep) {
        this.$t = "Rep";
        this.rep = rep;
        this.sep = sep;
    }
    
    return new Rep(rep, sep);
};
    