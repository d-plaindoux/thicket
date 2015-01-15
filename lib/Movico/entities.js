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
    
    Entities.prototype.freeVariables = function(patternNongenerics, aType) {
        switch (reflect.typeof(aType)) {
            case 'TypePolymorphic':
                return this.freeVariables(patternNongenerics, aType.type).minus(list(aType.variables));

            case 'Model':
                return list(aType.params).foldL(list(), function (result, param) {
                    return result.append(types.freeVariables(param.type));
                });
                
            case 'Controller':                
                return list(aType.specifications).foldL(types.freeVariables(aType.param.type), function (result, specification) {
                    return result.append(types.freeVariables(specification.type));
                }).append(list(aType.behaviors).foldL(list(), function (result, behavior) {
                    return result.append(option.some(behavior.caller).map(function (caller) {
                        return types.freeVariables(caller).minus(patternNongenerics);
                    }).orElse(list()));
                }));
                
            case 'View':
                return types.freeVariables(aType.param.type);      
                
            default:
                return types.freeVariables(aType);
        }
    };
                 
    function unify(aType1, aType2) {
        return types.unify(aType1, aType2).map(function (result) {
            return aTry.success(result);
        }).recoverWith(aTry.failure(new Error("Cannot unify " + aType1 + " and " + aType2)));
    }

    function analyseEntity(nongenerics, environment, substitutions, patternSubstitutions, entity) {
        var newEnvironment, newSubstitutions;
        
        switch (reflect.typeof(entity)) {
            case 'TypePolymorphic':
                newSubstitutions = list(entity.variables).map(function (name) {
                    return pair(name,ast.type.native(name));
                }).append(substitutions);

                return analyseEntity(nongenerics.append(list(entity.variables)), environment, newSubstitutions, patternSubstitutions, entity.type);
                
            case 'Model':
                return aTry.success(entity);
                
            case 'Controller':
                newEnvironment = list(pair("self", types.substitute(substitutions, entity))).append(environment); 
                
                return list(entity.behaviors).foldL(aTry.success(entity), function (result, method) {
                    types.reset();
                    
                    return result.flatmap(function() {
                        return list(entity.specifications).findFirst(function (specification) {
                            return specification.name === method.name;
                        }).map(function (specification) {
                            return aTry.success(specification);
                        }).orElse(aTry.failure(new Error("Specification not found for " + method.name))).flatmap(function (specification) {
                            var callerType = option.some(method.caller).orElse(entity.param.type);
                            
                            return unify(types.substitute(substitutions.append(patternSubstitutions), callerType), types.substitute(substitutions, entity.param.type)).map(function () {
                                return specification;
                            });
                        }).flatmap(function (specification) {
                            var genericsAndTypes = types.genericsAndType(specification.type),
                                callerType = option.some(method.caller).orElse(entity.param.type);

                            newSubstitutions = genericsAndTypes._1.map(function (name) {
                                return pair(name, ast.type.native(name));
                            }).append(substitutions);

                            newEnvironment = list(pair(entity.param.name, types.substitute(substitutions.append(patternSubstitutions), callerType))).append(newEnvironment);

                            return expressions.analyse(nongenerics, newEnvironment, newSubstitutions, method.definition).flatmap(function(substitutionsAndType) {
                                return unify(substitutionsAndType._2, types.substitute(newSubstitutions, genericsAndTypes._2)).flatmap(function() {
                                    return result;
                                });
                            });                        
                        });
                    });
                });
                
            case 'View':
                newEnvironment = list(pair(entity.param.name, entity.param.type), pair("self", entity)).append(environment);
                
                return list(entity.body).foldL(aTry.success(entity), function (result, body) {
                    types.reset();

                    return result.flatmap(function () {
                        return expressions.analyse(nongenerics, newEnvironment, substitutions, body).flatmap(function (substitutionsAndType) {
                            return unify(expressions.native(substitutions, "xml"), substitutionsAndType._2).flatmap(function() {
                                return result;
                            });
                        });
                    });
                });
            default:
                return aTry.failure(new Error("Unsupported entity"));
        }
    }
    
    Entities.prototype.analyse = function (environment, substitutions, patternsubstitutions, entity) {
        return analyseEntity(list(), environment, substitutions, patternsubstitutions, entity);
    };

    Entities.prototype.nongenerics = function (entities) {
        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.patternOnly(entity)) {
                return result;
            }
            
            return result.add(getName(entity));
        }).append(list(["number","string","xml","unit"]));
    };
                                         
    Entities.prototype.patternNongenerics = function (entities) {
        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.patternOnly(entity)) {
                return result.add(getName(entity));
            }
            
            return result;
        });
    };
                                         
    Entities.prototype.substitutions = function (entities) {
        var typeDef = list(["number","string","xml","unit"]).map(function (name) { 
                return pair(name, ast.type.native(name));
            });            
        
        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.patternOnly(entity)) {
                return result;
            }
                
            return result.add(pair(getName(entity), entity));
        }).append(typeDef);
    };
                                         
    Entities.prototype.patternSubstitutions = function (entities) {
        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.patternOnly(entity)) {
                return result.add(pair(getName(entity), entity));
            }
                
            return result;
        });
    };
                                   
    Entities.prototype.environment = function (entities) {
        return list(entities.orElse([])).foldL(list(), function (result, entity) { 
            return result.append(types.builder(entity).map(function (builder) { 
                return list(pair(getName(entity), builder));
            }).recoverWith(list()));
        });
    };
    
    return new Entities();
}());
    
    