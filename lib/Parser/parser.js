/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.parser = function () {
    
    'use strict';

    var option = require('../Data/option.js').option,
        rule = require('./rule.js').rule;
    
    //
    // Group class
    //
    
    function Group(parser) {
        this.parser = parser;
        this.rules = [];
        this.skipped = undefined;
        this.totalTime = 0;
    }
    
    function add(array, value, parseFn) {
        array.push(rule(value, parseFn));
    }

    Group.prototype.addRule = function (value,parseFn) {
        add(this.rules, value, parseFn);
        return this;        
    };
    
    Group.prototype.addSkip = function (value) {
        if (this.skipped === undefined) {
            this.skipped = new Group(this.parse);
        }
        this.skipped.addRule(value, function () { return true; });
        
        return this;        
    };
    
    Group.prototype.parse = function (stream) {
        var skip, t0 = new Date().getTime(), totalTime = this.totalTime;
        
        if (this.skipped) {
            skip = this.skipped;
        } else if (this === this.parser.skipped) {
            skip = null;
        } else {
            skip = this.parser.skipped;
        }
        
        try {
            return this.parser.step(skip, this.rules, stream);
        } finally {
            this.totalTime = totalTime + (new Date().getTime() - t0);
        }
    };
    
    //
    // Parser class
    //
    
    function Parser() {
        this.skipped = new Group(this);
        this.groups = {};
    }
    
    Parser.prototype.addSkip = function (value) {
        this.skipped.addRule(value, function () { return true; });
    };
    
    Parser.prototype.group = function (name) {
        if (!this.groups.hasOwnProperty(name)) {
            this.groups[name] = new Group(this);
        }
        
        return this.groups[name];
    };
        
    Parser.prototype.entry = function (name) {
        var that = this;
        
        return function (stream) {
            return that.group(name).parse(stream);
        };
    };
    
    function skipAll(skipped, stream) {
        while(skipped.parse(stream).orElse(false)) {
            // Continue
        }
    }
      
    Parser.prototype.skip = function (stream) {
        return skipAll(this.skipped, stream);
    };
    
    Parser.prototype.step = function (skipped, rules, stream) {
        try {
            var skip = skipped?function (stream) { skipAll(skipped, stream); }:null,
                rule, result;
            for (rule in rules) {            
                result = rules[rule].apply(stream, skip);                                
                if (result.isPresent()) {
                    return result;
                }                
            }
        } catch (consume) {
            // ignore
        }
        
        return option.empty();
    };
            
    //
    // Constructor
    //
    
    return new Parser();
};