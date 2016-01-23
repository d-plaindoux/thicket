/*jshint -W061 */

/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

module.exports = (function() {    
    return function(driver) {
        var fsdriver = require('../../Data/option.js').some(driver),
            reader = fsdriver.map(function(driver) { 
                return require('../resource/reader.js')(driver); 
            }),
            runtime = require('../runtime/runtime.js')(reader);

        return runtime;
    };
    
}());