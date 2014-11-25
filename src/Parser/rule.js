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
    
    var monad = require('../Data/option.js');
    
    //
    // Rule class
    //
    
    function Rule(value, parseFn) {
        this.value = value;
        this.parseFn = parseFn;
    }
    
    function accept(skip, value, stream, bind) {
        if (value instanceof RegExp) {
            skip(stream);

            return stream.nextRegexp(value.source);
        
        } else if (typeof value === 'string') {
            skip(stream);

            return stream.nextToken(value);

        } else if (value instanceof Array) {
            skip(stream);

            var item, itemResult, result = [];
            
            for (item in value) {
                if (value.hasOwnProperty(item)) {
     
                    itemResult = accept(skip, value[item], stream, bind);
                    
                    if (itemResult.isPresent()) {
                        result.push(itemResult.get());
                    } else {
                        return itemResult;
                    }
                }
            }

            return monad.option(result);
            
        } else if (typeof value === 'object' && value.hasOwnProperty("value") && value.hasOwnProperty("bind")) {
            return accept(skip, value.value, stream, bind).map(function (result) {
                bind[value.bind] = result;
                return result;
            });

        } else if (typeof value === 'object' && value.hasOwnProperty("optrep")) {
            var result = [], 
                current = accept(skip, value.optrep, stream, bind);
            
            while (current.isPresent()) {
                result = result.concat([current.get()]);
                current = accept(skip, value.optrep, stream, bind);
            }
            
            return monad.option(result);

        } else if (typeof value === 'object' && value.hasOwnProperty("rep")) {
            var result = [], 
                current = accept(skip, value.rep, stream, bind);
            
            if (!current.isPresent()) {
                return monad.option();
            }
            
            do {
                result = result.concat([current.get()]);
                current = accept(skip, value.rep, stream, bind);
            } while(current.isPresent());
            
            return monad.option(result);

        } else if (typeof value === 'object' && value.hasOwnProperty("opt")) {
            var result = [], 
                current = accept(skip, value.opt, stream, bind);
        
            if (current.isPresent()) {
                result = result.concat([current.get()]);
            }
            
            return monad.option(result);

        } else if (typeof value === 'object' && value.hasOwnProperty("commit")) {
            var current = accept(skip, value.commit, stream, bind);
        
            if (current.isPresent()) {
                return current;
            }
            
            throw new Error(stream.location());

        } else if (value instanceof Function) {
            skip(stream);

            return value(stream);
        }
        
        return monad.option();
    }
    
    Rule.prototype.apply = function (stream, skip) {
        var that = this,
            bind = {},
            result = accept(skip || function () {}, this.value, stream, bind);
        
        return result.map(function (value) {
            return that.parseFn(bind);
        });
    };
        
    //
    // Constructor
    //

    return new Rule(value, parseFn);
    
};