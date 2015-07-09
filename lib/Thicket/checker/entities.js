/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
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
        entity = require('../checker/entity.js'),
        types = require('../checker/types.js'),
        stringify = require('../syntax/stringify.js'),
        expressions = require('../checker/expressions.js');

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
   
    function analyseController(nongenerics, environment, models, specifications, anEntity) {
        var selfType = anEntity,
            environmentWithSelfType = list(pair("self", selfType)).append(environment),
            varnum = types.varnum;
                
        return list(selfType.behaviors).foldL(aTry.success(anEntity), function (result, method) {
            types.varnum = varnum;
            
            return result.flatmap(function() {
                return list(anEntity.specifications).findFirst(function (specification) {
                    return specification.name === method.name;
                }).map(function (specification) {
                    return aTry.success(specification);
                }).orElse(aTry.failure(error(anEntity, "Specification not found for " + method.name))).flatmap(function (specification) {
                    return types.unfold(specifications, anEntity.param.type).flatmap(function (paramType) {
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
                            newEnvironment = list(pair(anEntity.param.name, callerType)).append(environmentWithSelfType);

                        return expressions.analyse(nongenerics, newEnvironment, specifications, method.definition, expectedType).flatmap(function() {
                            return result;
                        }); 
                    });
                });
            });
        });                
    }
    
    function analyseExpression(nongenerics, environment, models,  specifications, anEntity) {
        var expressionType = option.some(anEntity.type).map(function(aType) {
                return types.unfold(specifications, aType).map(function (unfoldType) {
                    return types.neutralize(unfoldType);
                });
            }).orElse(aTry.success(null));
        
        return expressionType.flatmap(function(expressionType) {
            return expressions.analyse(nongenerics, environment, specifications, anEntity.expr, expressionType).map(function(result) {
                if (!anEntity.type) {
                    anEntity.type = types.generalize(types.substitute(result._1, result._2));
                } 

                return anEntity.type;
            });
        });
    }

    function analyseForall(nongenerics, environment, models,  specifications, anEntity) {
        return types.unfold(specifications, types.neutralize(anEntity)).flatmap(function (unfoldType) {
            return analyseEntity(nongenerics, environment, models,  specifications, unfoldType);
        });
    }
    
    function analyseEntity(nongenerics, environment, models,  specifications, anEntity) {    
        switch (anEntity.$type) {
            case 'TypePolymorphic':
                return analyseForall(nongenerics, environment, models,  specifications, anEntity);
                
            case 'Controller':
                return analyseController(nongenerics, environment, models,  specifications, anEntity);
              
            case 'Expression':
                return analyseExpression(nongenerics, environment, models,  specifications, anEntity);                
                                
            default:
                return aTry.success(anEntity);
        }
    }
    
    Entities.prototype.analyse = function(nongenerics, environment, models,  specifications, entities) {
        return list(entities).foldL(aTry.success(list()), function (result, anEntity) {
            types.reset();
            
            return result.flatmap(function (result) {
                return analyseEntity(nongenerics, environment, models,  specifications, entity.entityDefinition(anEntity)).map(function() {
                    return result.add(anEntity);
                });
            });
        });        
    };

    Entities.prototype.nongenerics = function (entities) {
        return list(entities.orElse([])).foldL(list(), function (result, anEntity) {
            if (types.isModel(entity.entityDefinition(anEntity))) {
                return result;
            }
            
            return result.add(entity.entityName(anEntity));
        });
    };
                                         
    Entities.prototype.nongenericModels = function (entities) {
        return list(entities.orElse([])).foldL(list(), function (result, anEntity) {
            if (types.isModel(anEntity)) {
                return result.add(entity.entityName(anEntity));
            }
            
            return result;
        });
    };
                                         
    Entities.prototype.specifications = function (entities) {
        return list(entities.orElse([])).foldL(list(), function (result, anEntity) {
            if (types.isModel(entity.entityDefinition(anEntity))) {
                return result;
            }
                
            return result.add(pair(entity.entityName(anEntity), 
                                   entity.entityType(entity.entityDefinition(anEntity))));
        });                            
    };
                                         
    Entities.prototype.models = function (entities) {    
        return list(entities.orElse([])).foldL(list(), function (result, anEntity) {
            if (types.isModel(entity.entityDefinition(anEntity))) {
                return result.add(pair(entity.entityName(anEntity), 
                                       entity.entityType(entity.entityDefinition(anEntity))));
            }
                
            return result;
        });
    };
                  
    Entities.prototype.environment = function (entities) {
        return list(entities.orElse([])).foldL(list(), function (result, anEntity) { 
            return result.append(entity.entityExpression(entity.entityDefinition(anEntity)).map(function (aType) { 
                return list(pair(entity.entityName(anEntity), aType));
            }).recoverWith(list()));
        });
    };
    
    return new Entities();
}());
    
    