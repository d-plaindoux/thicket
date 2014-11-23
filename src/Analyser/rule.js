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
    
    function accept(value, stream) {
        if (value instanceof RegExp) {
            return stream.nextRegexp(value.source);
        
        } else if (typeof value === 'string') {
            return stream.nextToken(value);

        } else if (value instanceof Array) {
            var item, itemResult, result = [];
            
            for (item in value) {
                if (value.hasOwnProperty(item)) {
     
                    itemResult = accept(value[item], stream);
                    
                    if (itemResult.isPresent()) {
                        result.push(itemResult.get());
                    } else {
                        return itemResult;
                    }
                }
            }

            return monad.option(result);
            
        } else if (value instanceof Function) {
            return value(stream);
        }
        
        return monad.option();
    }
    
    Rule.prototype.apply = function (stream) {
        var that = this, result = accept(this.value, stream);
        
        return result.map(function (value) {
            return that.parseFn(value);
        });
    };
        
    //
    // Constructor
    //

    return new Rule(value, parseFn);
    
};