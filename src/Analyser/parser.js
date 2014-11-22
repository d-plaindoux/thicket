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

    var monad = require('../Monad/option.js'),
        rules = require('./rule.js');
    
    //
    // Parser class
    //
    
    function Parser() {
        this.skipped = [];
        this.rules = [];
    }
    
    function add(array, value, parseFn) {
        if (value instanceof RegExp) {
            array.push(rules.rule(true, value.source, parseFn));
        } else if (typeof value === 'string') {
            array.push(rules.rule(false, value, parseFn));
        }
    }
    
    Parser.prototype.addSkip = function (value) {
        add(this.skipped, value, function (a) { return true; });
    };
    
    Parser.prototype.addRule = function (value, parseFn) {
        add(this.rules, value, parseFn);
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
        this.skip(stream);

        var checkpoint = stream.checkpoint(),
            rule,
            result;
        
        for (rule in this.rules) {
            
            if (this.rules.hasOwnProperty(rule)) {
                result = this.rules[rule].apply(stream);
                if (result.isPresent()) {
                    return result;
                }
                
                checkpoint();
            }
        }
        
        return monad.option();
    };
            
    //
    // Constructor
    //
    
    return new Parser();
};