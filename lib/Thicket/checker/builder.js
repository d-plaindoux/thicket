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
        list = require('../../Data/list.js'),
        ast = require('../syntax/ast.js');
    
    function Builder() {
        // Nothing for the moment
    }
            
    Builder.prototype.entityExpression = function (aType) {
        switch (aType.$type) {
            case 'TypePolymorphic':
                return this.entityExpression(aType.type).map(function (expresssion) {
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

            case 'View':
                return aTry.success(ast.type.abstraction(aType.param.type,ast.type.variable("dom"))); 
            
            case 'Expression':
                return aTry.success(aType.type);
                
            default:
                return aTry.failure(new Error("No expression available for " + aType));
        }
        
    };

    Builder.prototype.entityName = function (aType) {
        switch (aType.$type) {
            case 'TypePolymorphic':
                return this.entityName(aType.type);
        
            case 'Module':
            case 'Typedef':
            case 'Model':
            case 'Controller':
            case 'View':
            case 'Expression':
            case 'Typedef':            
                return aType.name;
                
            default:
                throw new Error("Illegal argument:" + aType.$type);
        }
    };
    
    Builder.prototype.entityType = function (aType) {
        switch (aType.$type) {
            case 'TypePolymorphic':
                return ast.type.forall(aType.variables, this.entityType(aType.type));
        
            case 'Typedef':
            case 'Model':
            case 'Controller':
            case 'View':
            case 'Typedef':            
                return aType;
                
            case 'Expression':
                return aType.type;
                
            default:
                throw new Error("Illegal argument:" + aType.$type);
        }
    };
    
    return new Builder();
}());
    
    