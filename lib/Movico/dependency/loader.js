/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    // var list = require('../../Data/list.js');
    
    function Dependencies(loader) {
        this.dependencies = {};
        this.loader = loader;
    }
    
    Dependencies.prototype.contains = function () {
        return false;
    };
        
    Dependencies.prototype.resolve = function (dependency) {        
        return this.loader(dependency);
    };
    
    return function(loader) {
        return new Dependencies(loader);
    };
    
}());