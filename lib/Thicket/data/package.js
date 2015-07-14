/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';
    
    var list = require('../../Data/list.js'),
        aTry = require('../../Data/atry.js'),
        ast = require('../syntax/ast.js');

    // 
    // Package management component
    //
    
    function Package(definitions) {
        this.definitions = definitions;
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
    
    function entityType(aType) {
        switch (aType.$type) {
            case 'TypePolymorphic':
                return entityType(aType.type).map(function (type) {
                    return ast.type.forall(aType.variables, type);
                });
                                    
            case 'Typedef':
            case 'Model':
            case 'Controller':
            case 'Typedef':            
                return aTry.success(aType);
                
            case 'Expression':
                return aTry.success(aType.type);
                
            default:
                return aTry.failure(new Error("No type available for " + aType));
        }
    }
    
    Package.prototype.findExpression = function(name) {
        return list(this.definitions.entities).findFirst(function (entity) {
            return entity.name === name;
        }).map(function (entity) {
            return entityExpression(entity.definition);
        }).orLazyElse(function () { 
            return aTry.failure(new Error("No type available named " + name));
        });        
    };

    Package.prototype.findType = function(name) {
        return list(this.definitions.entities).findFirst(function (entity) {
            return entity.name === name;
        }).map(function (entity) {
            return entityType(entity.definition);
        }).orLazyElse(function () { 
            return aTry.failure(new Error("No type available named " + name));
        });
    };
        
    return function (manager) {
        return new Package(manager);
    };
}());