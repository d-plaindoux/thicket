/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function () {
    
    'use strict';

    var option = require('../Data/option.js'),
        rule = require('./rule.js');
    
    //
    // Group class
    //
    
    function Group(parser) {
        this.parser = parser;
        this.doNotSkip = false;
        this.rules = [];
        this.totalTime = 0;
    }
    
    function add(array, value, parseFn) {
        array.push(rule(value, parseFn));
    }
    
    Group.prototype.noSkip = function() {
        this.doNotSkip = true;
        return this;
    };
    
    Group.prototype.addRule = function (value,parseFn) {
        add(this.rules, value, parseFn);
        return this;        
    };
        
    Group.prototype.parse = function (stream) {
        var skip, t0 = new Date().getTime(), totalTime = this.totalTime;
        
        if (this.doNotSkip || this === this.parser.skipped) {
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
        this.locationFn = undefined;
        this.groups = {};
    }
    
    Parser.prototype.addLocationFn = function(locationFn) {
        this.locationFn = locationFn;
    };
    
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
                result = rules[rule].apply(stream, skip, this.locationFn);                                
                if (result.isPresent()) {
                    return result;
                }                
            }
        } catch (consume) {
            // ignore
        }
        
        return option.none();
    };
            
    //
    // Constructor
    //
    
    return new Parser();
};