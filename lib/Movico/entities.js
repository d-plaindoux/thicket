/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports.entities = (function () {
    
    'use strict';
    
    var reflect = require('../Data/reflect.js').reflect,
        option = require('../Data/option.js').option,
        aTry = require('../Data/atry.js').atry,
        list = require('../Data/list.js').list,
        pair = require('../Data/pair.js').pair,
        types = require('./types.js').types,
        ast = require('./ast.js').ast,
        expressions = require('./expressions.js').expressions;
    
    var predefined = [
        pair("number", ast.type.native("number")),
        pair("string", ast.type.native("string")),
        pair("unit", ast.type.native("unit")),
        pair("xml", ast.type.native("xml")),
        pair("Pair", ast.type.forall(["a", "b"],
                                     ast.model("Pair",
                                               [ast.type.variable("a"),
                                                ast.type.variable("b")],
                                                [ast.param("_1",ast.type.variable("a")),
                                                ast.param("_2",ast.type.variable("b"))])))
    ];
    
    function Entities() {
        // Nothing for the moment
    }
    
    Entities.prototype.entityName = function (aType) {
        switch (reflect.typeof(aType)) {
            case 'TypePolymorphic':
                return this.entityName(aType.type);
         
            case 'Typedef':
            case 'Model':
            case 'Controller':
            case 'View':
            case 'Typedef':
                return aType.name;
                
            default:
                throw new Error("Illegal argument:" + reflect.typeof(aType));
        }
    };
    
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
                
            case 'Typedef':
                return types.freeVariables(aType.type);      
                
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
        var newEnvironment;
        
        switch (reflect.typeof(entity)) {
            case 'TypePolymorphic':
                substitutions = list(entity.variables).map(function (name) {
                    return pair(name,ast.type.native(name));
                }).append(substitutions);

                return analyseEntity(nongenerics.append(list(entity.variables)), environment, substitutions, patternSubstitutions, entity.type);
                
            case 'Model':
                return aTry.success(entity);
                
            case 'Controller':
                environment = list(pair("self", types.substitute(substitutions, entity, true))).append(environment);
                
                return list(entity.behaviors).foldL(aTry.success(entity), function (result, method) {
                    types.reset();
                    
                    return result.flatmap(function() {
                        return list(entity.specifications).findFirst(function (specification) {
                            return specification.name === method.name;
                        }).map(function (specification) {
                            return aTry.success(specification);
                        }).orElse(aTry.failure(new Error("Specification not found for " + method.name))).flatmap(function (specification) {
                            var callerType = option.some(method.caller).orElse(entity.param.type);
                            
                            return unify(types.substitute(substitutions.append(patternSubstitutions), callerType), 
                                         types.substitute(substitutions, entity.param.type)).map(function () {
                                return specification;
                            });
                        }).flatmap(function (specification) {
                            var genericsAndTypes = types.genericsAndType(types.freshType(types.substitute(substitutions, specification.type))),
                                callerType = option.some(method.caller).orElse(entity.param.type),
                                expectedType = types.reduce(ast.type.specialize(ast.type.forall(genericsAndTypes._1.value, genericsAndTypes._2), 
                                                                                genericsAndTypes._1.map(function (name) {
                                    return ast.type.native(name);
                                }).value)).success();

                            newEnvironment = list(pair(entity.param.name, 
                                                       types.substitute(substitutions.append(patternSubstitutions), callerType)
                                                      )).append(environment);

                            return expressions.analyse(nongenerics, newEnvironment, substitutions, method.definition, expectedType).flatmap(function() {
                                return result;
                            });                        
                        });
                    });
                });
                
            case 'View':
                environment = list(pair(entity.param.name, entity.param.type), pair("self", entity)).append(environment);
                
                return list(entity.body).foldL(aTry.success(entity), function (result, body) {
                    types.reset();

                    return result.flatmap(function () {
                        var xmlType = expressions.native(substitutions, "xml");
                        return expressions.analyse(nongenerics, environment, substitutions, body, xmlType).flatmap(function () {
                            return result;
                        });
                    });
                });
                
            case 'Typedef':
                return aTry.success(entity);
                

            default:
                return aTry.failure(new Error("Unsupported entity"));
        }
    }
    
    Entities.prototype.analyse = function (environment, substitutions, patternsubstitutions, entity) {
        return analyseEntity(list(), environment, substitutions, patternsubstitutions, entity);
    };

    Entities.prototype.nongenerics = function (entities) {
        var that = this;
        
        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.patternOnly(entity)) {
                return result;
            }
            
            return result.add(that.entityName(entity));
        }).append(list(["number","string","xml","unit","Pair"]));
    };
                                         
    Entities.prototype.patternNongenerics = function (entities) {
        var that = this;

        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.patternOnly(entity)) {
                return result.add(that.entityName(entity));
            }
            
            return result;
        });
    };
                                         
    Entities.prototype.substitutions = function (entities) {
        var that = this;

        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.patternOnly(entity)) {
                return result;
            }
                
            return result.add(pair(that.entityName(entity), entity));
        }).append(list(predefined));
    };
                                         
    Entities.prototype.patternSubstitutions = function (entities) {
        var that = this;

        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.patternOnly(entity)) {
                return result.add(pair(that.entityName(entity), entity));
            }
                
            return result;
        });
    };
                                   
    Entities.prototype.environment = function (entities) {
        var that = this;
        
        return list(entities.orElse([])).foldL(list(), function (result, entity) { 
            return result.append(types.builder(entity).map(function (builder) { 
                return list(pair(that.entityName(entity), builder));
            }).recoverWith(list()));
        });
    };
    
    return new Entities();
}());
    
    