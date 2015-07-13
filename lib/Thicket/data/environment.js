/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var aTry = require('../../Data/atry.js');
    
    function Environment(packages) {
        var self = this;
        
        self.packages = packages;
    }
    
    function notFound(kind, name) {
        return new Error("No " + kind + " available named " + name);
    }

    function notRetreive(kind, namespace, name) {
        return new Error("No " + kind + " available named " + name + " in " + namespace);
    }
    
    Environment.prototype.findExpression = function(name) {
        var self = this;
        
        return self.packages.list().foldL(aTry.failure(notFound("expression", name)), function(result, aPackage) {
            if (result.isSuccess()) {
                return result;
            } 
            
            return aPackage.findExpression(name);
         });
    };
    
    Environment.prototype.findType = function(name) {
        var self = this;
        
        return self.packages.list().foldL(aTry.failure(notFound("type", name)), function(result, aPackage) {
            if (result.isSuccess()) {
                return result;
            } 
            
            return aPackage.findType(name);
         });
    };
    
    Environment.prototype.getExpression = function(namespace, name) {
        var self = this;
        
        return self.packages.retrieve(namespace).map(function (aPackage) {
            return aPackage.findExpression(name);
        }).orLazyElse(function () { 
            return aTry.failure(notRetreive("expression", namespace,name));
        });
    };
    
    Environment.prototype.getType = function(namespace, name) {
        var self = this;
        
        return self.packages.retrieve(namespace).map(function (aPackage) {
            return aPackage.findType(name);
        }).orLazyElse(function () { 
            return aTry.failure(notRetreive("type", namespace,name));
        });
    };
    
    return function(packages) {
        return new Environment(packages);
    };
}());
