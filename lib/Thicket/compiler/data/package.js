/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';
    
    var list = require('../../../Data/list.js'),
        aTry = require('../../../Data/atry.js'),
        ast = require('../syntax/ast.js'),
        stringify = require('../syntax/stringify.js');

    // 
    // Package management component
    //
    
    function Package(definitions) {
        this.definitions = definitions;
        this.definitions.entities.forEach(function (entity) {
            entity.namespace = definitions.namespace;
        });
    }
    
    function entityExpression(aType) {
        switch (aType.$type) {
            case 'TypePolymorphic':
                return entityExpression(aType.type).map(function (expresssion) {
                    return ast.type.forall(aType.variables, expresssion);
                });
                
            case 'Model':
                if (aType.abstract) {
                    return aTry.failure(new Error("Abstract model " + aType.name));
                }
                
                return aTry.success(list(aType.params).foldR(function (param, result) {
                    return ast.type.abstraction(param.type, result);
                }, aType));
                
            case 'Controller':
                return aTry.success(ast.type.abstraction(aType.param.type,aType)); 

            case 'Expression':
                return aTry.success(aType.type);
                
            default:
                return aTry.failure(new Error("No expression available for " + aType));
        }    
    }
    
    function entityType(aType, model) {
        switch (aType.$type) {
            case 'TypePolymorphic':
                return entityType(aType.type).map(function (type) {
                    return ast.type.forall(aType.variables, type);
                });
                                    
            case 'Model':
                if (aType.parent && !model) {
                    return aTry.failure(new Error("Model type " + stringify(aType.parent) + " must be used instead of " + stringify(aType)));
                }
            
                return aTry.success(aType);                    
                
            case 'Typedef':
            case 'Controller':
            case 'Typedef':            
                return aTry.success(aType);
                
            case 'Expression':
                return aTry.success(aType.type);
                
            default:
                return aTry.failure(new Error("No type available for " + aType));
        }
    }
    
    Package.prototype.namespace = function() {
        return this.definitions.namespace;
    };
    
    Package.prototype.imports = function() {
        return list(this.definitions.imports);
    };
        
    Package.prototype.addEntities = function(entities) {
        this.definitions.entities = this.definitions.entities.concat(entities);
    };
        
    Package.prototype.entities = function() {
        return list(this.definitions.entities);
    };
    
    Package.prototype.notRetreive = function (kind, name) {
        return new Error("No " + kind + " available named " + 
                         name + " in " + this.definitions.namespace);
    };
        
    Package.prototype.inNamespace = function(name) {
        return list(this.definitions.entities).findFirst(function (entity) {
            return entity.name === name;
        }).isPresent();
    };

    Package.prototype.findExpression = function(name) {
        var self = this;
        
        return list(this.definitions.entities).findFirst(function (entity) {
            return entity.name === name;
        }).map(function (entity) {
            return entityExpression(entity.definition);
        }).orLazyElse(function () { 
            return aTry.failure(self.notRetreive("expression", name));
        });        
    };

    Package.prototype.findType = function(name, model) {
        var self = this;

        return list(this.definitions.entities).findFirst(function (entity) {
            return entity.name === name;
        }).map(function (entity) {
            return entityType(entity.definition, model);
        }).orLazyElse(function () { 
            return aTry.failure(self.notRetreive("type", name));
        });
    };
        
    return function (manager) {
        return new Package(manager);
    };
}());