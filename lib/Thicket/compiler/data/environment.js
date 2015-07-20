/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var aTry = require('../../../Data/atry.js');
    
    function Environment(packages, allowModels) {
        var that = this;
        
        that.packages = packages;
        that.allowingModels = allowModels;
    }
    
    function notFound(kind, name) {
        return new Error("No " + kind + " available named " + name);
    }
    
    function notRetreive(kind, namespace, name) {
        return new Error("No " + kind + " available named " + name + " in " + namespace);
    }

    Environment.prototype.allowModels = function() {
        return new Environment(this.packages, true);
    };
    
    Environment.prototype.getExpression = function(namespace, name) {
        var that = this;
        
        return that.packages.retrieve(namespace).map(function (aPackage) {
            return aPackage.findExpression(name);
        }).orLazyElse(function () { 
            return aTry.failure(notRetreive("expression", namespace,name));
        });
    };
    
    Environment.prototype.getType = function(namespace, name) {
        var that = this;
        
        return that.packages.retrieve(namespace).map(function (aPackage) {
            return aPackage.findType(name, that.allowingModels);
        }).orLazyElse(function () { 
            return aTry.failure(notRetreive("type", namespace,name));
        });
    };
    
    Environment.prototype.findTypeNamespace = function(name) {
        return this.packages.list().foldL(aTry.failure(notFound("type",name)), function(result, aPackage) {
            if (result.isSuccess()) {
                return result;
            }
            
            if (aPackage.containsType(name)) {
                return aTry.success(aPackage.namespace());
            } else {
                return result;
            }
        });
    };
    
    Environment.prototype.findExpressionNamespace = function(name) {
        return this.packages.list().foldL(aTry.failure(notFound("expression",name)), function(result, aPackage) {
            if (result.isSuccess()) {
                return result;
            }
            
            if (aPackage.containsExpression(name)) {
                return aTry.success(aPackage.namespace());
            } else {
                return result;
            }
        });
    };
    
    return function(packages) {
        return new Environment(packages, false);
    };
}());
