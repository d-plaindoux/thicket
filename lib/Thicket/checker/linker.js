/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var aTry = require('../../Data/atry.js'),
        list = require('../../Data/list.js');
    
    function Linker(packages) {
        this.packages = packages;
    }
    
    function notRetreive(kind, namespace, name) {
        return new Error("No " + kind + " available named " + name + " in " + namespace);
    }

    function notDeclared(namespace, name) {
        return new Error(name + " available in " + namespace + " but missing in the import");
    }    
        
    function notFound(namespace) {
        return new Error("Package " + namespace + " not found");
    }    
        
    Linker.prototype.findInImports = function(aPackage, namespace ,name) {
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

    Linker.prototype.findNamespace = function(namespace, name) {
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
    
    Linker.prototype.linkType = function() {
        return aTry.failure(new Error("Not yet implemented"));
    };

    Linker.prototype.linkExpression = function() {
        return aTry.failure(new Error("Not yet implemented"));
    };

    Linker.prototype.linkEntity = function(namespace, entity) {
        var self = this;
        
        switch (entity.$type) {
            case 'TypePolymorphic':
                return self.linkEntity(namespace, entity.type);
                
            case 'Model':
                return list(entity.params).foldL(aTry.success(null), function (result, param) {
                    return result.flatmap(function() {
                        return self.linkType(namespace, param.type);
                    });
                });
                
            case 'Controller':                
                return list(entity.specifications).foldL(aTry.success(null), function (result, specification) {
                    return result.flatmap(function() {
                        return self.linkType(namespace, specification.type);
                    });
                }).flatmap(function(r) {
                    return list(entity.behaviors).foldL(r, function (result, behavior) {
                        return result.flatmap(function() {
                            return self.linkExpression(namespace, behavior.caller);
                        });                        
                    });
                });
                
            case 'Expression':
                return self.linkExpression(namespace, entity.expr).flatmap(function(r) {
                    if (entity.type) {
                        return self.linkType(namespace, entity.type);
                    } else {
                        return r;
                    }
                });
                
            case 'Typedef':
                return self.linkType(namespace, entity.type);      
                
            default:
                return aTry.success(null);
        }
        return entity;
    };
    
    Linker.prototype.linkEntities = function(namespace) { 
        var self = this;
        
        return self.packages.retrieve(namespace).map(function(aPackage) {
            return list(aPackage.entities()).foldL(aTry.success(null), function (result, entity) {
                return result.flatmap(function() {
                    return self.linkEntity(namespace, entity);
                });
            });           
        }).orLazyElse(function() {
            return aTry.failure(notFound(namespace));
        });
    };
    
    return function(packages) {
        return new Linker(packages);
    };
    
}());