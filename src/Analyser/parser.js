/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.parser = function () {
    
    'use strict';

    var movico = require('./rule.js');
    
    //
    // Parser class
    //
    
    function Parser() {
        this.skipped = [];
        this.rules = [];
    }
    
    function add(array, value, parseFn) {
        if (value instanceof RegExp) {
            array.push(movico.rule(true, value.source, parseFn));
        } else if (typeof value === 'string') {
            array.push(movico.rule(false, value, parseFn));
        }
    }
    
    Parser.prototype.addSkip = function (value) {
        add(this.skipped, value, function (a) { return true; });
    };
    
    Parser.prototype.addRule = function (value, parseFn) {
        add(this.skip, value, parseFn);
    };
    
    Parser.prototype.skip = function (stream) {
        var skipped, rule;
        
        do {
            skipped = false;
            for (rule in this.skipped) {
                if (this.skipped.hasOwnProperty(rule)) {
                    skipped = skipped || this.skipped[rule].apply(stream).orElse(false);
                }
            }
        } while (skipped);
    };
      
    Parser.prototype.step = function (stream) {
        var checkpoint = stream.checkpoint(), result;
        
        this.skip(stream);
    };
            
    //
    // Constructor
    //
    
    return new Parser();
};