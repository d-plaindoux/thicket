/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

exports.stream = function(value) {
    
    // Lexeme internal class
    
    function Lexeme(length, stream) {
        this.length = length;
        this.stream = stream;
        this.value = stream.value.substring(this.stream.offset, this.stream.offset + this.length); 
    }

    Lexeme.prototype.accept = function() {
        this.stream.offset += this.length;
        return this;    
    };
    
    // Stream class
    
    function Stream(value) {            
        this.offset = 0;
        this.value = value;
    };
    
    Stream.prototype.length = function() {
        return this.value.length - this.offset;
    };
    
    Stream.prototype.isEmpty = function() {
        return this.value.length == this.offset;
    };
    
    Stream.prototype.nextToken = function(value) {
        if (this.isEmpty() || value.length > this.length()) {
            return undefined;
        } 
        
        if (this.value.substring(this.offset, this.offset + value.length) === value) {            
            return new Lexeme(value.length, this);
        } 
        
        return null;
    };
    
    return new Stream(value);
};


