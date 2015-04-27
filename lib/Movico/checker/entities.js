/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var error = require('../exception.js'),
        option = require('../../Data/option.js'),
        aTry = require('../../Data/atry.js'),
        list = require('../../Data/list.js'),
        pair = require('../../Data/pair.js'),
        builder = require('../checker/builder.js'),
        types = require('../checker/types.js'),
        ast = require('../syntax/ast.js'),
        stringify = require('../syntax/stringify.js'),
        expressions = require('../checker/expressions.js');
    
    var predefined = [
        pair("number", ast.type.native("number")),
        pair("string", ast.type.native("string")),
        pair("unit", ast.type.native("unit")),
        pair("dom", ast.type.native("dom")),
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
    
    Entities.prototype.freeVariables = function(patternNongenerics, aType) {
        switch (aType.$type) {
            case 'TypeRecursive':
                return this.freeVariables(patternNongenerics, aType.type);

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
                
            case 'Expression':
                if (aType.type) {
                    return types.freeVariables(aType.type);
                } else {
                    return list();
                }
                break;
                
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
        }).recoverWith(aTry.failure(new Error("Cannot unify " + stringify(aType1) + " and " + stringify(aType2))));
    }
   
    function analyseController(nongenerics, environment, substitutions, patternSubstitutions, entity) {
        var selfType = entity,
            environmentWithSelfType = list(pair("self", selfType)).append(environment);
                
        return list(selfType.behaviors).foldL(aTry.success(entity), function (result, method) {
            return result.flatmap(function() {
                return list(entity.specifications).findFirst(function (specification) {
                    return specification.name === method.name;
                }).map(function (specification) {
                    return aTry.success(specification);
                }).orElse(aTry.failure(error(entity, "Specification not found for " + method.name))).flatmap(function (specification) {
                    var paramType = types.substitute(substitutions, entity.param.type),
                        callerType = option.some(method.caller).map(function(caller) {
                        var trueCaller = types.substitute(substitutions.append(patternSubstitutions),caller);
                        return types.instantiate(trueCaller);
                    }).orElse(paramType);

                    return unify(callerType, paramType).map(function (newSubstitutions) {
                        return [types.substitute(newSubstitutions, callerType), specification];
                    });
                }).flatmap(function (callerTypeAndspecification) {
                    var callerType = callerTypeAndspecification[0],
                        specification = callerTypeAndspecification[1],
                        expectedType = types.neutralize(types.substitute(substitutions, specification.type));

                    var newEnvironment = list(pair(entity.param.name, callerType)).append(environmentWithSelfType);
                    
                    return expressions.analyse(nongenerics, newEnvironment, substitutions, method.definition, expectedType).flatmap(function() {
                        return result;
                    });                        
                });
            });
        });                
    }
    
    function analyseView(nongenerics, environment, substitutions, patternSubstitutions, entity) {
        var newEnvironment = list(pair(entity.param.name, entity.param.type), pair("self", entity)).append(environment);

        return list(entity.body).foldL(aTry.success(entity), function (result, body) {
            return result.flatmap(function () {
                var xmlType = expressions.native(substitutions, "dom");
                return expressions.analyse(nongenerics, newEnvironment, substitutions, body, xmlType).flatmap(function () {
                    return result;
                });
            });
        });
    }
    
    function analyseExpression(nongenerics, environment, substitutions, patternSubstitutions, entity) {
        var expressionType = option.some(entity.type).map(function(aType) {
                return types.neutralize(types.substitute(substitutions, aType));
            }).orElse(null);
        
        return expressions.analyse(nongenerics, environment, substitutions, entity.expr, expressionType).map(function(result) {
            if (!entity.type) {
                entity.type = types.generalize(types.substitute(result._1.append(substitutions), result._2));
            } 
            
            return entity.type;
        });
    }

    function analyseForall(nongenerics, environment, substitutions, patternSubstitutions, entity) {
        return analyseEntity(nongenerics, environment, substitutions, patternSubstitutions, types.neutralize(entity));
    }
    
    function analyseEntity(nongenerics, environment, substitutions, patternSubstitutions, entity) {    
        switch (entity.$type) {
            case 'TypePolymorphic':
                return analyseForall(nongenerics, environment, substitutions, patternSubstitutions, entity);
                
            case 'Controller':
                return analyseController(nongenerics, environment, substitutions, patternSubstitutions, entity);
                
            case 'View':
                return analyseView(nongenerics, environment, substitutions, patternSubstitutions, entity);
                
            case 'Expression':
                return analyseExpression(nongenerics, environment, substitutions, patternSubstitutions, entity);                
                
            case 'Model':
            case 'Typedef':
                /* TODO - check type consistency */
                return aTry.success(entity);
                
            default:
                return aTry.failure(error(entity, "Unsupported entity " + entity));
        }
    }
    
    Entities.prototype.analyse = function(nongenerics, environment, substitutions, patternSubstitutions, entities) {
        return list(entities).foldL(aTry.success(list()), function (result, entity) {
            types.reset();
            
            return result.flatmap(function (result) {
                return analyseEntity(nongenerics, environment, substitutions, patternSubstitutions, entity).map(function() {
                    return result.add(entity);
                });
            });
        });        
    };

    Entities.prototype.nongenerics = function (entities) {
        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.patternOnly(entity)) {
                return result;
            }
            
            return result.add(builder.entityName(entity));
        }).append(list(["number","string","dom","unit","Pair"]));
    };
                                         
    Entities.prototype.patternNongenerics = function (entities) {
        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.patternOnly(entity)) {
                return result.add(builder.entityName(entity));
            }
            
            return result;
        });
    };
                                         
    Entities.prototype.substitutions = function (entities) {
        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.patternOnly(entity)) {
                return result;
            }
                
            return result.add(pair(builder.entityName(entity), builder.entityType(entity)));
        }).append(list(predefined));                            
    };
                                         
    Entities.prototype.patternSubstitutions = function (entities) {    
        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.patternOnly(entity)) {
                return result.add(pair(builder.entityName(entity), builder.entityType(entity)));
            }
                
            return result;
        });
    };
                                   
    Entities.prototype.environment = function (entities) {
        return list(entities.orElse([])).foldL(list(), function (result, entity) { 
            return result.append(builder.entityExpression(entity).map(function (aType) { 
                return list(pair(builder.entityName(entity), aType));
            }).recoverWith(list()));
        });
    };
    
    return new Entities();
}());
    
    