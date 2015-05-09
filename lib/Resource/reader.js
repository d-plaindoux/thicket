/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';

    var naming = require('./naming.js');

    function Reader(driver) {
        this.driver = driver;
    }

    Reader.prototype.specifications = function(name) {
        return JSON.parse(this.driver.readContent(naming.specification(name)));
    };
    
    Reader.prototype.code = function(name) {
        return this.driver.readContent(naming.code(name)).toString();
    };
    
    Reader.prototype.content = function(name) {
        return this.driver.readContent(name).toString();
    };
    
    return function(driver) {
        return new Reader(driver);
    };
}());