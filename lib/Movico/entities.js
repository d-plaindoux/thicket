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
        option = require('../Data/option.js').option,
        aTry = require('../Data/atry.js').atry,
        list = require('../Data/list.js').list,
        pair = require('../Data/pair.js').pair,
        types = require('./types.js').types,
        ast = require('./ast.js').ast,
        expressions = require('./expressions.js').expressions;
    
    function Entities() {
        // Nothing for the moment
    }
    
    function getConstructor(aType) {
        switch (reflect.typeof(aType)) {
            case 'TypePolymorphic':
                return ast.type.forall(aType.variables, getConstructor(aType.type));
                
            case 'Model':
                return list(aType.params).foldR(function (param, result) {
                    return ast.type.abstraction(param.type, result);
                }, option.some(aType.parent).orElse(aType));
                
            case 'Controller':
            case 'View':
                return ast.type.abstraction(aType.param.type,aType); 
        }
        
        throw new Error("Illegal argument");
    }
    
    function getName(aType) {
        switch (reflect.typeof(aType)) {
            case 'TypePolymorphic':
                return getName(aType.type);
                
            case 'Model':
            case 'Controller':
            case 'View':
                return aType.name;
        }
        
        throw new Error("Illegal argument");
    }
    

    Entities.prototype.freeVariables = function(aType) {
        switch (reflect.typeof(aType)) {
            case 'TypePolymorphic':
                return this.freeVariables(aType.type).minus(list(aType.variables));

            case 'Model':
                return list(aType.params).foldL(list(), function (result, param) {
                    return result.append(types.freeVariables(param.type));
                });
                
            case 'Controller':                
                return list(aType.specifications).foldL(types.freeVariables(aType.param.type), function (result, specification) {
                    return result.append(types.freeVariables(specification.type));
                }).append(list(aType.behaviors).foldL(list(), function (result, behavior) {
                    return result.append(option.some(behavior.caller).map(function (caller) {
                        return types.freeVariables(caller);
                    }).orElse(list()));
                }));
                
            case 'View':
                return types.freeVariables(aType.param.type);      
                
            default:
                return types.freeVariables(aType);
        }
    };
                 
    function unify(aType1, aType2) {
        return types.unify(aType1, aType2);
    }

    Entities.prototype.analyse = function (environment, substitutions, entity) {
        var newEnvironment, newSubstitutions;
        
        switch (reflect.typeof(entity)) {
            case 'TypePolymorphic':
                newSubstitutions = list(entity.variabless).map(function (n) {
                    return pair(n,ast.type.native(n));
                }).append(substitutions);

                return this.analyse(environment, newSubstitutions, entity.type);
                
            case 'Model':
                return aTry.success(entity);
                
            case 'Controller':
                newEnvironment = list(pair("self", entity)).append(environment); 
                
                return list(entity.behaviors).foldL(aTry.success(entity), function (result, method) {
                    types.reset();
                    
                    return result.flatmap(function() {
                        return list(entity.specifications).findFirst(function (specification) {
                            return specification.name === method.name;
                        }).map(function (specification) {
                            return aTry.success(specification);
                        }).orElse(aTry.failure(new Error("Specification not found for " + method.name))).flatmap(function (specification) {
                            newEnvironment = list(pair(entity.param.name, option.some(method.caller).orElse(entity.param.type))).append(newEnvironment);
                
                            return expressions.analyse(list(), newEnvironment, substitutions, method.definition).flatmap(function(substitutionsAndType) {
                                var genericsAndType = types.genericsAndType(specification.type);

                                newSubstitutions = genericsAndType._1.map(function (n) {
                                    return pair(n,ast.type.native(n));
                                }).append(substitutions);
                
                                return unify(types.substitute(newSubstitutions, genericsAndType._2), substitutionsAndType._2).flatmap(function() {
                                    return result;
                                });
                            });                        
                        });
                    });
                });
                
            case 'View':
                newEnvironment = list(pair(entity.param.name, entity.param.type), pair("self", entity)).append(environment);
                
                return list(entity.body).foldL(aTry.success(entity), function (result, body) {
                    return result.flatmap(function () {
                        return expressions.analyse(list(), newEnvironment, substitutions, body).flatmap(function (substitutionsAndType) {
                            return unify(expressions.native(substitutions, "xml"), substitutionsAndType._2).flatmap(function() {
                                return result;
                            });
                        });
                    });
                });
            default:
                return aTry.failure(new Error("Unsupported entity"));
        }
    };

    Entities.prototype.nongenerics = function (entities) {
        return list(entities.orElse([])).map(function (entity) {            
            return getName(entity);
        });
    };
                                         
    Entities.prototype.substitutions = function (entities) {
        var typeDef = list(["number","string","xml","unit"]),            
            substitutions = list(entities.orElse([])).map(function (entity) {            
                return pair(getName(entity), entity);
            });
        
        return substitutions.append(typeDef.map(function (name) { 
            return pair(name, ast.type.native(name));
        }));
    };
                                       
    Entities.prototype.environment = function (entities) {
        return list(entities.orElse([])).map(function (entity) { 
            return pair(getName(entity), getConstructor(entity));
        });
    };
    
    return new Entities();
}());
    
    