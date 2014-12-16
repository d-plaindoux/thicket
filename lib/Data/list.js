/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.list = (function () {
    
    'use strict';
    
    function List(value) {
        this.value = value;
    }    
    
    List.prototype.isEmpty = function () {
        return this.value.length === 0;
    };
    
    List.prototype.append = function() {
        return new List(this.value.concat(Array.prototype.slice.call(arguments)));
    };
    
    List.prototype.foldR = function(bindcall,result) { 
        var i;
        for(i = this.value.length; i > 0; i--) {
            result = bindcall(this.value[i-1], result);
        }
        return result;
    };
    
    List.prototype.foldL = function(result, bindcall) {
        var i;
        for(i = 0; i < this.value.length; i++) {
            result = bindcall(result, this.value[i]);
        }
        return result;
    };
    
    List.prototype.map = function (bindCall) {
        return new List(this.value.map(bindCall));
    };
    
    List.prototype.filter = function (bindCall) {
        return new List(this.value.filter(bindCall));
    };

    List.prototype.flatmap = function (bindCall) {
        var result = [];
        this.value.forEach(function (value) {
            result = result.concat(bindCall(value));
        });
        return new List(result);
    };
    
    List.prototype.orElse = function (value) {
        if (this.isEmpty()) {
            return value;
        } else {
            return this.value;
        }
    };
    
    return function () { return new List(Array.prototype.slice.call(arguments)); };
}());