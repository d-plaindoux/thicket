/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

exports.parse = function() {
    
    var movico = require('rule.js');
    
    function Parser() {
        this.skip = [];
        this.rules = [];
    }
    
    function add(array, value, parseFn) {
        if (value instanceof RegExp) {
            array.concat(movico.rule(true, value.source, parseFn));
        } else if (typeof value === 'string') {
            array.concat(movico.rule(false, value, parseFn));
        } else {
            // Reject
        }
    }
    
    Parser.prototype.skip = function(value) {
        add(this.skip, value, function(_){});
    };
    
    Parser.prototype.addRule = function(value, parseFn) {
        add(this.skip, value, parseFn);
    };
        
};