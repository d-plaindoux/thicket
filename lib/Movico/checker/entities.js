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
    
    Entities.prototype.freeVariables = function(nongenericModels, aType) {
        switch (aType.$type) {
            case 'TypeRecursive':
                return this.freeVariables(nongenericModels, aType.type);

            case 'TypePolymorphic':
                return this.freeVariables(nongenericModels, aType.type).minus(list(aType.variables));

            case 'Model':
                return list(aType.params).foldL(list(), function (result, param) {
                    return result.append(types.freeVariables(param.type));
                });
                
            case 'Controller':                
                return list(aType.specifications).foldL(types.freeVariables(aType.param.type), function (result, specification) {
                    return result.append(types.freeVariables(specification.type));
                }).append(list(aType.behaviors).foldL(list(), function (result, behavior) {
                    return result.append(option.some(behavior.caller).map(function (caller) {
                        return types.freeVariables(caller).minus(nongenericModels);
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
        }).lazyRecoverWith(function () {
            return aTry.failure(new Error("Cannot unify " + stringify(aType1) + " and " + stringify(aType2)));
        });
    }
   
    function analyseController(nongenerics, environment, models, specifications, entity) {
        var selfType = entity,
            environmentWithSelfType = list(pair("self", selfType)).append(environment);
                
        return list(selfType.behaviors).foldL(aTry.success(entity), function (result, method) {
            return result.flatmap(function() {
                return list(entity.specifications).findFirst(function (specification) {
                    return specification.name === method.name;
                }).map(function (specification) {
                    return aTry.success(specification);
                }).orElse(aTry.failure(error(entity, "Specification not found for " + method.name))).flatmap(function (specification) {
                    return types.unfold(specifications, entity.param.type).flatmap(function (paramType) {
                        var callerType = option.some(method.caller).map(function(caller) {
                                return types.unfold(specifications.append(models), caller).map(function (type) {
                                    return types.instantiate(type);
                                });
                            }).orElse(aTry.success(paramType));

                        return callerType.flatmap(function (callerType) {
                            return unify(callerType, paramType).map(function (newSubstitutions) {
                                return [types.substitute(newSubstitutions, callerType), specification];
                            });
                        });
                    });
                }).flatmap(function (callerTypeAndspecification) {
                    var callerType = callerTypeAndspecification[0],
                        specification = callerTypeAndspecification[1];
                    
                    return types.unfold(specifications, specification.type).flatmap(function (unfoldType) {
                        var expectedType = types.neutralize(unfoldType),
                            newEnvironment = list(pair(entity.param.name, callerType)).append(environmentWithSelfType);

                        return expressions.analyse(nongenerics, newEnvironment, specifications, method.definition, expectedType).flatmap(function() {
                            return result;
                        }); 
                    });
                });
            });
        });                
    }
    
    function analyseView(nongenerics, environment, models,  specifications, entity) {
        var newEnvironment = list(pair(entity.param.name, entity.param.type), pair("self", entity)).append(environment);

        return list(entity.body).foldL(aTry.success(entity), function (result, body) {
            return result.flatmap(function () {
                var xmlType = expressions.native(specifications, "dom");
                return expressions.analyse(nongenerics, newEnvironment, specifications, body, xmlType).flatmap(function () {
                    return result;
                });
            });
        });
    }
    
    function analyseExpression(nongenerics, environment, models,  specifications, entity) {
        var expressionType = option.some(entity.type).map(function(aType) {
                return types.unfold(specifications, aType).map(function (unfoldType) {
                    return types.neutralize(unfoldType);
                });
            }).orElse(aTry.success(null));
        
        return expressionType.flatmap(function(expressionType) {
            return expressions.analyse(nongenerics, environment, specifications, entity.expr, expressionType).map(function(result) {
                if (!entity.type) {
                    entity.type = types.generalize(types.substitute(result._1, result._2));
                } 

                return entity.type;
            });
        });
    }

    function analyseForall(nongenerics, environment, models,  specifications, entity) {
        return types.unfold(specifications, types.neutralize(entity)).flatmap(function (unfoldType) {
            return analyseEntity(nongenerics, environment, models,  specifications, unfoldType);
        });
    }
    
    function analyseEntity(nongenerics, environment, models,  specifications, entity) {    
        switch (entity.$type) {
            case 'TypePolymorphic':
                return analyseForall(nongenerics, environment, models,  specifications, entity);
                
            case 'Controller':
                return analyseController(nongenerics, environment, models,  specifications, entity);
                
            case 'View':
                return analyseView(nongenerics, environment, models,  specifications, entity);
                
            case 'Expression':
                return analyseExpression(nongenerics, environment, models,  specifications, entity);                
                                
            default:
                return aTry.success(entity);
        }
    }
    
    Entities.prototype.analyse = function(nongenerics, environment, models,  specifications, entities) {
        return list(entities).foldL(aTry.success(list()), function (result, entity) {
            types.reset();
            
            return result.flatmap(function (result) {
                return analyseEntity(nongenerics, environment, models,  specifications, entity).map(function() {
                    return result.add(entity);
                });
            });
        });        
    };

    Entities.prototype.nongenerics = function (entities) {
        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.isModel(entity)) {
                return result;
            }
            
            return result.add(builder.entityName(entity));
        }).append(list(["number","string","dom","unit","Pair"]));
    };
                                         
    Entities.prototype.nongenericModels = function (entities) {
        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.isModel(entity)) {
                return result.add(builder.entityName(entity));
            }
            
            return result;
        });
    };
                                         
    Entities.prototype.specifications = function (entities) {
        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.isModel(entity)) {
                return result;
            }
                
            return result.add(pair(builder.entityName(entity), builder.entityType(entity)));
        }).append(list(predefined));                            
    };
                                         
    Entities.prototype.models = function (entities) {    
        return list(entities.orElse([])).foldL(list(), function (result, entity) {
            if (types.isModel(entity)) {
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
    
    