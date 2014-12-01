/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.stream = function (value) {

    'use strict';

    var option = require('../Data/option.js').option;
        
    //
    // Location
    //
    
    function Location(offset,line,character,sentence) {
        this.offset = offset;
        this.line = line;
        this.character = character;
        this.sentence = sentence;
    }
    
    Location.prototype.toString = function () {
        return "line " + this.line + " character " + this.character;
    };
    
    //
    // Stream class
    //
    
    function Stream(value) {
        this.offset = 0;            
        this.value = value;
        this.line = 1;
        this.character = 1;
        this.sentence = "";
        
        this.lastlocation = new Location(this.offset, this.line, this.character, this.sentence);
    }
    
    Stream.prototype.location = function () {
        return this.lastlocation;
    };
    
    Stream.prototype.remaining = function () {
        return this.value.length - this.offset;
    };
    
    Stream.prototype.consume = function(value) {
        this.offset += value.length;
        this.line += (value.match(/\n/g) || []).length;
        if (value.lastIndexOf('\n') > -1) {
            this.character = value.length - value.lastIndexOf("\n");
            this.sentence = value.substring(value.lastIndexOf("\n")+1, value.length);
        } else {
            this.character += value.length;
            this.sentence += value;
        }
        
        if (this.offset > this.lastlocation.offset) {
            this.lastlocation.offset = this.offset;
            this.lastlocation.line = this.line;
            this.lastlocation.character = this.character;
            this.lastlocation.sentence = this.sentence;
        }
    };
    
    Stream.prototype.checkpoint = function () {
        var that = this,
            offset = this.offset,
            line = this.line,
            character = this.character,
            sentence = this.sentence;
        
        return function () {
            that.offset = offset;
            that.line = line;
            that.character = character;
            that.sentence = sentence;
        };
    };
    
    Stream.prototype.isEmpty = function () {
        return this.value.length === this.offset;
    };
    
    Stream.prototype.nextToken = function (value) {
        if (this.isEmpty() || value.length > this.remaining()) {
            return option();
        }
        
        if (value === this.value.slice(this.offset, this.offset + value.length)) {
            this.consume(value);        
            return option(value);
        }

        return option();
    };
    
    Stream.prototype.nextRegexp = function (value) {
        if (this.isEmpty()) {
            return option();
        }

        var matched = value.exec(this.value.slice(this.offset, this.value.length));

        if (matched) {
            this.consume(matched[0]);
            return option(matched[0]);
        }
        
        return option();
    };
        
    //
    // Constructor
    //
    
    return new Stream(value);
};


