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
    
    var type = require('../Data/type.js').type,
        option = require('../Data/option.js').option;
    
    function List(value) {
        this.value = value;
    }    
    
    List.prototype.isEmpty = function () {
        return this.value.length === 0;
    };
    
    List.prototype.append = function(list) {
        return new List(this.value.concat(list.value));
    };

    List.prototype.add = function(element) {
        return new List(this.value.concat([element]));
    };
    
    List.prototype.contains = function(element) {
        return !this.filter(function (value) {
            return value === element;
        }).isEmpty();
    };
    
    List.prototype.foldR = function(funcall,result) { 
        var i;
        for(i = this.value.length; i > 0; i--) {
            result = funcall(this.value[i-1], result);
        }
        return result;
    };
    
    List.prototype.foldL = function(result, funcall) {
        var i;
        for(i = 0; i < this.value.length; i++) {
            result = funcall(result, this.value[i]);
        }
        return result;
    };
    
    List.prototype.findFirst = function (funcall) {
        var i;
        for(i = 0; i < this.value.length; i++) {
            if (funcall(this.value[i])) {
                return option.some(this.value[i]);
            }
        }
        return option.empty();        
    };

    List.prototype.filter = function (funcall) {
        return this.foldL(new List([]), function (r, v) {
            if (funcall(v)) {
                return r.add(v);
            } else {
                return r;
            }
        });
    };

    List.prototype.map = function (funcall) {
        return this.foldL(new List([]), function (r, v) {
            return r.add(funcall(v));
        });
    };

    List.prototype.flatmap = function (funcall) {
        var result = new List([]);
        this.value.forEach(function (value) {
            result = result.append(funcall(value));
        });
        return result;
    };
    
    return function () { 
        if (arguments.length === 1 && type.get(arguments[0]) === 'Array') {
            return new List(arguments[0]);
        }
        
        return new List(Array.prototype.slice.call(arguments)); 
    };
}());