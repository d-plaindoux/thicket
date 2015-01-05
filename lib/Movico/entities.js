/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.entities = (function () {
    
    'use strict';
    
    var reflect = require('../Data/reflect.js').reflect,
        aTry = require('../Data/atry.js').atry,
        list = require('../Data/list.js').list,
        pair = require('../Data/pair.js').pair,
        types = require('./types.js').types,
        ast = require('./ast.js').ast,
        expressions = require('./expressions.js').expressions;
    
    function Entities() {
        // Nothing for the moment
    }
    
    Entities.prototype.freeVariables = function(entity) {
        switch (reflect.typeof(entity)) {
            case 'Model':
                return list(entity.params).foldL(list(), function (result, param) {
                    return result.append(types.freeVariables(param.type));
                }).minus(list(entity.generics));
                
            case 'Controller':                
                return list(entity.specifications).foldL(types.freeVariables(entity.param.type), function (result, specification) {
                    return result.append(types.freeVariables(specification.type));
                }).minus(list(entity.generics));
                
            case 'View':
                return types.freeVariables(entity.param.type).minus(list(entity.generics));
                
            default:
                return aTry.failure(new Error("Unsupported entity"));
        }
    };
    
    Entities.prototype.analyse = function (variables, entity) {
        var newVariables;
        
        switch (reflect.typeof(entity)) {
            case 'Model':
                return aTry.success(entity);
                
            case 'Controller':
                newVariables = list(pair(entity.param.name, entity.param.type), pair("self", entity)).append(variables);
                
                return list(entity.behaviors).foldL(aTry.success(entity), function (result, method) {
                    return result.flatmap(function() {
                        return list(entity.specifications).findFirst(function (specification) {
                            return specification.name === method.name;
                        }).map(function (specification) {
                            return aTry.success(specification);
                        }).orElse(aTry.failure(new Error("Specification not found for " + method.name))).flatmap(function (specification) {
                            return expressions.analyse(list(entity.generics), newVariables, method.definition).flatmap(function(variablesAndType) {
                                return types.unify(specification.type, variablesAndType._2).flatmap(function() {
                                    return result;
                                });
                            });                        
                        });
                    });
                });
                
            case 'View':
                newVariables = list(pair(entity.param.name, entity.param.type), pair("self", entity)).append(variables);
                return list(entity.body).foldL(aTry.success(entity), function (result, body) {
                    return result.flatmap(function () {
                        return expressions.analyse(list(entity.generics), newVariables, body).flatmap(function (variablesAndType) {
                            return types.unify(ast.type.native("xml"), variablesAndType._2).flatmap(function() {
                                return result;
                            });
                        });
                    });
                });
            default:
                return aTry.failure(new Error("Unsupported entity"));
        }
    };
    
    return new Entities();
}());
    
    