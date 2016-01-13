/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function (opt) {
    
    'use strict';
    
    function Opt(opt) {
        this.$t = "Opt";
        this.opt = opt;
    }
    
    return new Opt(opt);
};
    