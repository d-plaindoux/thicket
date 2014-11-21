/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

exports.parser = function() {
    
    var movico = require('./rule.js');
    
    function Parser() {
        this.skipped = [];
        this.rules = [];
    }
    
    function add(array, value, parseFn) {
        if (value instanceof RegExp) {
            array.push(movico.rule(true, value.source, parseFn));
        } else if (typeof value === 'string') {
            array.push(movico.rule(false, value, parseFn));
        } else {
            // Reject
        }
    }
    
    Parser.prototype.addSkip = function(value) {
        add(this.skipped, value, function(_){ return true; });
    };
    
    Parser.prototype.addRule = function(value, parseFn) {
        add(this.skip, value, parseFn);
    };
    
    Parser.prototype.skip = function(stream) {                
        var skipped;
        
        do {
            skipped = false;            
            for(var rule in this.skipped) {
                skipped = skipped || this.skipped[rule].apply(stream).orElse(false);
            };
        } while(skipped);
    };
      
    Parser.prototype.step = function(stream) {
        var checkpoint = stream.checkpoint(), result;
        
        this.skip(stream);  
        
        for(rule in this.rules) {
                
        }        
    };   
    
    return new Parser();
};