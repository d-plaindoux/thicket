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
    
    function notRetreive(kind, namespace, name) {
        return new Error("No " + kind + " available named " + name + " in " + namespace);
    }

    function notDeclared(namespace, name) {
        return new Error(name + " available in " + namespace + " but missing in the import");
    }
    
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
    
    Environment.prototype.findInImports = function(aPackage, namespace ,name) {
        var self = this;

        return aPackage.imports().foldL(aTry.failure(notRetreive("entity", namespace, name)), function(result, anImport) {
            if (result.isSuccess()) {
                return result;
            }             

            return self.packages.retrieve(anImport.namespace).map(function(aPackage) {
                if (aPackage.inNamespace(name)) {
                    if (anImport.names.length === 0 || anImport.names.indexOf(name) !== -1) {
                        return aTry.success(anImport.namespace);
                    }

                    return aTry.failure(notDeclared(anImport.namespace, name));
                }

                return result;
            }).orElse(result);
        });            
    };

    Environment.prototype.findNamespace = function(namespace, name) {
        var self = this;
        
        return self.packages.retrieve(namespace).map(function (aPackage) {
            if (aPackage.inNamespace(name)) {
                return aTry.success(namespace);
            }
                        
            return self.findInImports(aPackage, namespace, name);    
        }).orLazyElse(function () { 
            return aTry.failure(notRetreive("entity", namespace, name));
        });     
    };
    
    return function(packages) {
        return new Environment(packages);
    };
}());
