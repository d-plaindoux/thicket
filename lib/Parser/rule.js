/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function (value, parseFn) {
    
    'use strict';
    
    var option = require('../Data/option.js'),
        reflect = require('../Data/reflect.js');

    //
    // Rule class
    //
    
    function Rule(value, parseFn) {
        this.value = value;
        this.parseFn = parseFn;
    }
    
    function tryAccept(accept, skip, value, stream, bind) {
        var result, current, item;
        
        if (value instanceof RegExp) {
            if (skip) {
                skip(stream);
            }
        
            return stream.nextRegexp(value);
        
        } else if (reflect.typeof(value) === 'string') {
            if (skip) {
                skip(stream);
            }

            return stream.nextToken(value);

        } else if (value instanceof Array) {
            result = [];
            
            for (item in value) {
                if (value.hasOwnProperty(item)) {
                    var itemResult = accept(skip, value[item], stream, bind);                    
                    if (itemResult.isPresent()) {
                        result.push(itemResult.get());
                    } else {
                        return option.empty();
                    }
                }
            }

            return option.some(result);
            
        } else if (reflect.typeof(value) === 'Bind') {
            return accept(skip, value.value, stream, bind).map(function (result) {
                bind[value.bind] = result;
                return result;
            });

        } else if (reflect.typeof(value) === 'Optrep') {
            result = [];
            
            try {
                current = accept(skip, value.optrep, stream, bind);            
                while (current.isPresent()) {
                    result = result.concat([current.get()]);
                    current = accept(skip, value.optrep, stream, bind);
                }
            } catch (consume) {
                // Ignore
            }
            
            return option.some(result);

        } else if (reflect.typeof(value) === 'Rep') {
            result = [];
            current = accept(skip, value.rep, stream, bind);
            
            if (!current.isPresent()) {
                return option.empty();
            }
            
            try {
                do {
                    result = result.concat([current.get()]);
                    current = accept(skip, value.rep, stream, bind);
                } while(current.isPresent());
            } catch (e) {
                // Consume
            }
            
            return option.some(result);

        } else if (reflect.typeof(value) === 'Opt') {
            result = [];
            
            try {
                current = accept(skip, value.opt, stream, bind);                    
                if (current.isPresent()) {
                    result = result.concat([current.get()]);
                }
            } catch (consume) {
                // Ignore
            }
            
            return option.some(result);

        } else if (reflect.typeof(value) === 'Choice') {
            for(item in value.choices) {
                result = accept(skip, value.choices[item], stream, bind);
                if (result.isPresent()) {
                    return result;
                }
            }

            return option.empty();
            
        } else if (reflect.typeof(value) === 'Commit') {
            current = accept(skip, value.commit, stream, bind);
        
            if (current.isPresent()) {
                return current;
            }
            
            throw new Error(stream.location());

        } else if (reflect.typeof(value) === 'EOS') {
            if (skip) {
                skip(stream);
            }
        
            if (stream.isEmpty()) {
                return option.some("$$");
            }
            
            throw new Error(stream.location());
            
        } else if (value instanceof Function) {
            return value(stream);
        }
        
        return option.empty();
    }
    
    var accept = function (skip, value, stream, bind) {
        var checkpoint = stream.checkpoint(),
            result = tryAccept(accept, skip, value, stream, bind);
        
        try {
            if (!result.isPresent()) {
                checkpoint();
            }
          
            return result;
        } catch (e) {
            checkpoint();
            throw e; 
        }                        
    };        
    
    Rule.prototype.apply = function (stream, skipped, locationFn) {
        var that = this,
            bind = {},
            location = stream.location();
                
        return accept(skipped, this.value, stream, bind).map(function () {
            var reduction = that.parseFn(bind);
            return option.some(locationFn).map(function (locationFn) {
                return locationFn(reduction, location);
            }).orElse(reduction);
        });
    };
        
    //
    // Constructor
    //

    return new Rule(value, parseFn);
    
};