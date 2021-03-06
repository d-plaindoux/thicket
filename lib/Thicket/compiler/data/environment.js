/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var error = require('../exception.js'),
        aTry = require('../../../Data/atry.js'),
        list = require('../../../Data/list.js'),
        symbols = require('../symbols.js'),
        ast = require('../syntax/ast.js');
    
    function Environment(packages, allowed) {
        var that = this;
        
        that.packages = packages;
        that.allowed = allowed || {models:false};
    }
    
    function notFound(kind, name) {
        return error(null, "No " + kind + " available named " + name, true);
    }
    
    function notRetreive(kind, namespace, name) {
        return error(null, "No " + kind + " available named " + name + " in " + namespace, true);
    }

    function publicDefinition(aType) {    
        
        switch (aType.$t) {             
            case symbols.TypePolymorphic:
                return ast.type.forall(aType.variables, publicDefinition(aType.type)); 
                
            case symbols.TypeSpecialize:
                return ast.type.specialize(publicDefinition(aType.type), aType.parameters);
                
            case symbols.EntitySpecialization:
                return ast.specialization(publicDefinition(aType.type), aType.parameters);
                
            case symbols.TypeFunction:
                return ast.type.abstraction(publicDefinition(aType.argument), publicDefinition(aType.result));

            case symbols.Trait:
                return ast.namespace(ast.trait(
                        aType.name, 
                        aType.variables,
                        aType.specifications,
                        [],
                        aType.derivations),
                    aType.namespace);

            case symbols.Controller:
                return ast.namespace(ast.controller(
                        aType.name, 
                        aType.variables,
                        aType.param,
                        aType.specifications,
                        [],
                        aType.derivations),
                    aType.namespace);
                
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
                return publicDefinition(aType);
            });
        }).orLazyElse(function () { 
            return aTry.failure(notRetreive("expression", namespace,name));
        });
    };
    
    Environment.prototype.getType = function(namespace, name) {
        var that = this;
        
        return that.packages.retrieve(namespace).map(function (aPackage) {
            return aPackage.findType(name, that.allowed).map(function(aType) {
                return publicDefinition(aType);
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
