/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.rule = function (value, parseFn) {
    
    'use strict';
    
    var monad = require('../Monad/option.js');
    
    //
    // Rule class
    //
    
    function Rule(value, parseFn) {
        this.value = value;
        this.parseFn = parseFn;
    }
    
    Rule.prototype.accept = function (stream) {
        if (this.value instanceof RegExp) {
            return stream.nextRegexp(this.value.source);
        
        } else if (typeof this.value === 'string') {
            return stream.nextToken(this.value);

        } else if (this.value instanceof Array) {
            var item, itemResult, result = [];
            
            for (item in this.value) {
                if (this.value.hasOwnProperty(item)) {
                    itemResult = this.accept(this.value[item]);
                    if (itemResult.isPresent()) {
                        result.push(itemResult.get());
                    } else {
                        return itemResult;
                    }
                }
            }
        }
    
        return monad.option();
    };
    
    Rule.prototype.apply = function (stream) {
        var that = this, result = this.accept(stream);
        
        return result.map(function (value) {
            return that.parseFn(result.get().accept().value);
        });
    };
        
    //
    // Constructor
    //

    return new Rule(value, parseFn);
    
};