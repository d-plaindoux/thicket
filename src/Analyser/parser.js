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
        this.groups = {};
    }
    
    function add(array, value, parseFn) {
        array.push(rules.rule(value, parseFn));
    }
    
    Parser.prototype.addSkip = function (value) {
        add(this.skipped, value, function (a) { return true; });
    };
    
    Parser.prototype.group = function (name) {
        var that = this, group;
        
        if (!this.groups.hasOwnProperty(name)) {
            this.groups[name] = [];
        }
        
        group = {
            addRule:
                function (value, parseFn) {
                    add(that.groups[name], value, parseFn);
                    return group;
                }
        };
        
        return group;
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
      
    Parser.prototype.step = function (name, stream) {
        this.skip(stream);

        var checkpoint = stream.checkpoint(),
            rules = this.groups[name],
            rule,
            result;
        
        for (rule in rules) {
            
            if (rules.hasOwnProperty(rule)) {
                result = rules[rule].apply(stream);
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