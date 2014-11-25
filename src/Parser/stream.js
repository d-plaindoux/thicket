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
    // Lexeme internal class
    //
    
    function Lexeme(length, stream) {
        this.length = length;
        this.stream = stream;
        this.value = stream.value.substring(this.stream.offset, this.stream.offset + this.length);
    }

    Lexeme.prototype.accept = function () {
        this.stream.offset += this.length;
        this.length = 0; // Idempotent
        return this;
    };
    
    //
    // Stream class
    //
    
    function Stream(value) {
        this.offset = 0;
        this.value = value;
    }
    
    Stream.prototype.remaining = function () {
        return this.value.length - this.offset;
    };
    
    Stream.prototype.checkpoint = function () {
        var that = this,
            offset = this.offset;
        
        return function () {
            that.offset = offset;
        };
    };
    
    Stream.prototype.isEmpty = function () {
        return this.value.length === this.offset;
    };
    
    Stream.prototype.nextToken = function (value) {
        if (this.isEmpty() || value.length > this.remaining()) {
            return option();
        }
        
        if (this.value.substring(this.offset, this.offset + value.length) === value) {
            this.offset += value.length;
            return option(value);
        }
        
        return option();
    };
    
    Stream.prototype.nextRegexp = function (value) {
        if (this.isEmpty()) {
            return option();
        }

        var matched = new RegExp("^" + value).exec(this.value.substring(this.offset, this.value.length));

        if (matched) {
            this.offset += matched[0].length;
            return option(matched[0]);
        }
        
        return option();
    };
        
    //
    // Constructor
    //
    
    return new Stream(value);
};


