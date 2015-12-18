/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var aTry = require('../../../Data/atry.js'),
        list = require('../../../Data/list.js'),
        ast = require('../syntax/ast.js');
    
    function Environment(packages, allowed) {
        var that = this;
        
        that.packages = packages;
        that.allowed = allowed || {models:false};
    }
    
    function notFound(kind, name) {
        return new Error("No " + kind + " available named " + name);
    }
    
    function notRetreive(kind, namespace, name) {
        return new Error("No " + kind + " available named " + name + " in " + namespace);
    }

    function getPublicDefinition(aType) {    
        switch (aType.$t) {             
            case 'TypePolymorphic':
                return ast.type.forall(aType.variables, 
                                       getPublicDefinition(aType.type)); 
                
            case 'TypeSpecialize':
                return ast.type.specialize(getPublicDefinition(aType.type), 
                                           aType.parameters);
                
            case 'EntitySpecialization':
                return ast.specialization(getPublicDefinition(aType.type), 
                                               aType.parameters);
                
            case 'TypeFunction':
                return ast.type.abstraction(getPublicDefinition(aType.argument), 
                                            getPublicDefinition(aType.result));

            case 'Trait':
                return ast.trait(
                    aType.name, 
                    aType.variables,
                    aType.specifications,
                    [],
                    aType.derivations.map(function(derivation){
                        return getPublicDefinition(derivation);
                    }));

            case 'Controller':
                return ast.controller(
                    aType.name, 
                    aType.variables,
                    aType.param,
                    aType.specifications,
                    [],
                    aType.derivations.map(function(derivation){
                        return getPublicDefinition(derivation);
                    }));
                
            default:
                return aType;
        }
    }
    
    Environment.prototype.allowModels = function() {
        return new Environment(this.packages, {models:true,});
    };
    
    Environment.prototype.getExpression = function(namespace, name) {
        var that = this;
        
        return that.packages.retrieve(namespace).map(function (aPackage) {
            return aPackage.findExpression(name).map(function(aType) {
                return getPublicDefinition(aType);
            });
        }).orLazyElse(function () { 
            return aTry.failure(notRetreive("expression", namespace,name));
        });
    };
    
    Environment.prototype.getType = function(namespace, name) {
        var that = this;
        
        return that.packages.retrieve(namespace).map(function (aPackage) {
            return aPackage.findType(name, that.allowed).map(function(aType) {
                return getPublicDefinition(aType);
            });
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

    Environment.prototype.adapters = function() {
        return this.packages.list().foldL(list(), function(adapters, aPackage) {
            return adapters.append(aPackage.adapters());
        });
    };
        
    return function(packages) {
        return new Environment(packages, false);
    };
}());
