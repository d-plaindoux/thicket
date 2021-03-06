/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
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
        
        //
        // Parser controle structures
        //
        
        switch (value.$t) {
        case 'Bind':
            return accept(skip, value.value, stream, bind).map(function (result) {
                bind[value.bind] = result;
                return result;
            });

        case 'Optrep':   
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

        case 'Rep':
            current = accept(skip, value.rep, stream, bind);

            if (!current.isPresent()) {
                return option.none();
            }

            result = [current.get()];

            try {
                current = value.sep ? stream.nextToken(value.sep) : current;

                while(current.isPresent()) {
                    current = accept(skip, value.rep, stream, bind);

                    if (value.sep && !current.isPresent()) {
                        return option.none();
                    }

                    if (current.isPresent()) {
                        result = result.concat([current.get()]);
                        current = value.sep ? stream.nextToken(value.sep) : current;
                    }
                }
            } catch (e) {
                // Consume
            }

            return option.some(result);

        case 'Opt':
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

        case 'Choice':
        for(item in value.choices) {
            result = accept(skip, value.choices[item], stream, bind);
            if (result.isPresent()) {
                return result;
            }
        }

        return option.none();

        case 'Commit':
            current = accept(skip, value.commit, stream, bind);

            if (current.isPresent()) {
                return current;
            }

            throw new Error(stream.location());

        case 'EOS':
            if (stream.isEmpty()) {
                return option.some("$$");
            }

            throw new Error(stream.location());
        }
        
        //
        // Javascript structures and controles
        //
        
        if (value instanceof RegExp) {
            return stream.nextRegexp(value);
        
        } else if (reflect.typeof(value) === 'string') {
            return stream.nextToken(value);

        } else if (value instanceof Array) {
            result = [];
            
            for (item in value) {
                if (value.hasOwnProperty(item)) {
                    var itemResult = accept(skip, value[item], stream, bind);                    
                    if (itemResult.isPresent()) {
                        result.push(itemResult.get());
                    } else {
                        return option.none();
                    }
                }
            }

            return option.some(result);
            
        } else if (value instanceof Function) {
            return value(stream);
        }
        
        return option.none();
    }
    
    var accept = function (skip, value, stream, bind) {
        if (skip) {
            skip(stream);
        }

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
    
    Rule.prototype.apply = function (stream, skip, locationFn) {
        if (skip) {
            skip(stream);
        }
                
        var that = this,
            bind = {},
            location = stream.location();
                
        return accept(skip, this.value, stream, bind).map(function () {
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