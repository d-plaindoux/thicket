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

    var option = require('../Data/option.js').option,
        rule = require('./rule.js').rule;
    
    
    function add(array, value, parseFn) {
        array.push(rule(value, parseFn));
    }

    //
    // Group class
    //
    
    function Group(parser) {
        this.parser = parser;
        this.rules = [];
    }
    
    Group.prototype.addRule = function (value,parseFn) {
        add(this.rules, value, parseFn);
        return this;        
    };
    
    Group.prototype.parse = function (stream) {
        return this.parser.step(this.rules, stream);
    };
    
    //
    // Parser class
    //
    
    function Parser() {
        this.skipped = [];
        this.groups = {};
    }
    
    Parser.prototype.addSkip = function (value) {
        add(this.skipped, value, function () { return true; });
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
    
    Parser.prototype.skipOne = function(stream) {
        var rule; 
        
        for (rule in this.skipped) {
            if (this.skipped[rule].apply(stream).orElse(false)) {
                return true;
            }
        } 
        
        return false;
    };

    Parser.prototype.skip = function (stream) {
        while(this.skipOne(stream)) {
            // Nothing
        }
    };
      
    Parser.prototype.step = function (rules, stream) {
        var checkpoint = stream.checkpoint(),
            that = this,
            skip = function (stream) { that.skip(stream); },
            rule,
            result;
        
        try {
            for (rule in rules) {
            
                if (rules.hasOwnProperty(rule)) {
                    result = rules[rule].apply(stream,skip);                
                    if (result.isPresent()) {
                        return result;
                    }
                
                    checkpoint();
                }
            }
        } catch (ignore) {
            checkpoint();
        }
        
        return option();
    };
            
    //
    // Constructor
    //
    
    return new Parser();
};