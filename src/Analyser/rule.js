/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.rule = function (regexp, value, parseFn) {
    
    'use strict';
    
    var option = require('../Monad/option.js');
    
    //
    // Rule class
    //
    
    function Rule(regexp, value, parseFn) {
        this.regexp = regexp;
        this.value = value;
        this.parseFn = parseFn;
    }
    
    Rule.prototype.apply = function (stream) {
        var that = this, result;
        
        if (this.regexp) {
            result = stream.nextRegexp(this.value);
        } else {
            result = stream.nextToken(this.value);
        }
        
        return result.map(function (value) {
            return that.parseFn(result.get().accept().value);
        });
    };
        
    //
    // Constructor
    //

    return new Rule(regexp, value, parseFn);
    
};