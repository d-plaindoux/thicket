/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var reflect = require('./reflect.js'),
        pair = require('./pair.js'),
        option = require('./option.js');
    
    function List(value) {
        this.value = value;
    }    
    
    List.prototype.size = function () {
        return this.value.length;
    };
    
    List.prototype.zipWith = function (list) {
        var i, zip = [];
        for (i = 0; i < Math.min(this.value.length, list.value.length); i++) {
            zip = zip.concat([pair(this.value[i], list.value[i])]);
        }
        return new List(zip);
    };
    
    List.prototype.isEmpty = function () {
        return this.value.length === 0;
    };
    
    List.prototype.add = function(element) {
        return new List(this.value.concat([element]));
    };

    List.prototype.append = function(list) {
        return new List(this.value.concat(list.value));
    };
    
    List.prototype.reverse = function () {
        return new List(this.value.slice().reverse());
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
        return option.none();        
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

    List.prototype.filterNot = function (funcall) {
        return this.filter(function(v) { return !funcall(v); });
    };

    List.prototype.same = function(list) {
        return this.minus(list).isEmpty() && list.minus(this).isEmpty();
    };
    
    List.prototype.minus = function (list) {
        return this.filterNot(function (v) {
            return list.contains(v);
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
        if (arguments.length === 1 && reflect.typeof(arguments[0]) === 'Array') {
            return new List(arguments[0]);
        }
        
        return new List(Array.prototype.slice.call(arguments)); 
    };
}());
