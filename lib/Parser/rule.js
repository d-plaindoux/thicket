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
    
    var option = require('../Data/option.js').option,
        type = require('../Data/type.js').type;

    //
    // Rule class
    //
    
    function Rule(value, parseFn) {
        this.value = value;
        this.parseFn = parseFn;
    }
    
    function unsafeAccept(accept, skip, value, stream, bind) {
        var result, current, item;
        
        if (value instanceof RegExp) {
            if (skip) {
                skip(stream);
            }
        
            return stream.nextRegexp(value);
        
        } else if (typeof value === 'string') {
            if (skip) {
                skip(stream);
            }

            return stream.nextToken(value);

        } else if (value instanceof Array) {
            var itemResult;
        
            result = [];
            
            for (item in value) {
                if (value.hasOwnProperty(item)) {
                    itemResult = accept(skip, value[item], stream, bind);                    
                    if (itemResult.isPresent()) {
                        result.push(itemResult.get());
                    } else {
                        return option();
                    }
                }
            }

            return option(result);
            
        } else if (type.get(value) === 'Bind') {
            return accept(skip, value.value, stream, bind).map(function (result) {
                bind[value.bind] = result;
                return result;
            });

        } else if (type.get(value) === 'Optrep') {
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
            
            return option(result);

        } else if (type.get(value) === 'Rep') {
            result = [];
            current = accept(skip, value.rep, stream, bind);
            
            if (!current.isPresent()) {
                return option();
            }
            
            try {
                do {
                    result = result.concat([current.get()]);
                    current = accept(skip, value.rep, stream, bind);
                } while(current.isPresent());
            } catch (e) {
                // Consume
            }
            
            return option(result);

        } else if (type.get(value) === 'Opt') {
            result = [];
            
            try {
                current = accept(skip, value.opt, stream, bind);                    
                if (current.isPresent()) {
                    result = result.concat([current.get()]);
                }
            } catch (consume) {
                // Ignore
            }
            
            return option(result);

        } else if (type.get(value) === 'Choice') {
            for(item in value.choices) {
                result = accept(skip, value.choices[item], stream, bind);
                if (result.isPresent()) {
                    return result;
                }
            }

            return option();
            
        } else if (type.get(value) === 'Commit') {
            current = accept(skip, value.commit, stream, bind);
        
            if (current.isPresent()) {
                return current;
            }
            
            throw new Error(stream.location());

        } else if (value instanceof Function) {
            return value(stream);
        }
        
        return option();
    }
    
    var accept = function (skip, value, stream, bind) {
        var checkpoint = stream.checkpoint(),
            result = unsafeAccept(accept, skip, value, stream, bind);
        
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
    
    Rule.prototype.apply = function (stream, skipped) {
        var that = this,
            bind = {},
            result = accept(skipped, this.value, stream, bind);
        
        return result.map(function () {
            return that.parseFn(bind);
        });
    };
        
    //
    // Constructor
    //

    return new Rule(value, parseFn);
    
};