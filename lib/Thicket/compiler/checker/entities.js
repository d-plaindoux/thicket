/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

/*
 * Definitively javascrit is too verbose in 
 * particular when dealing with lambda terms!
 */

module.exports = (function () {
    
    'use strict';
    
    var option = require('../../../Data/option.js'),
        aTry = require('../../../Data/atry.js'),
        list = require('../../../Data/list.js'),
        pair = require('../../../Data/pair.js'),
        error = require('../exception.js'),
        stringify = require('../syntax/stringify.js'),
        types = require('./types.js'),
        expression = require('./expression.js'),
        expressions = require('./expressions.js');

    function Entities() {
        // Nothing for the moment
    }
    
    function checkDerivations(environment, anEntity, visited) {
        if (visited.contains(anEntity.name)) {
            return aTry.failure(error(anEntity, "Cyclic specification for " + stringify(types.reduce(anEntity,true)), true));
        }
        
        return list(anEntity.derivations).foldL(aTry.success(anEntity), function (result, derivation) {
            return result.flatmap(function() {
                return types.unfold(list(), environment, derivation).flatmap(function (unfoldType) {
                    return types.reduce(unfoldType).flatmap(function (definition) {
                        if (definition.$type === "Model") {
                            return result;
                        } else if (definition.$type === "Trait") {
                            return checkDerivations(environment, definition, visited.add(anEntity.name));
                        } else {
                            return aTry.failure(error(anEntity, stringify(types.reduce(derivation,true)) + " is not a model"));
                        }
                    });
                });
            });
        });
    }
       
    function analyseTrait(environment, anEntity) {
        var bindings = list(pair("self", anEntity)),
            varnum = types.varnum;
        
        // Check | derivarions must be models
        return checkDerivations(environment, anEntity, list()).flatmap(function(result) {
            return list(anEntity.behaviors).foldL(aTry.success(result), function (result, method) {
                types.varnum = varnum;

                return result.flatmap(function() {
                    return expression.retrieveCallerType(environment, anEntity, method.name).flatmap(function (specification) {
                        return types.unfold(list(), environment, specification).flatmap(function (unfoldType) {
                            var expectedType = types.neutralize(unfoldType);

                            return expressions.analyse(bindings, environment, method.definition, expectedType).flatmap(function() {
                                return result;
                            }); 
                        });
                    });
                });
            }); 
        });
    }

    function analyseController(environment, anEntity) {
        var selfType = anEntity,
            bindings = list(pair("self", selfType)),
            varnum = types.varnum;
        
        // Check | derivarions must be models
        return checkDerivations(environment, anEntity, list()).flatmap(function(result) {
            return list(selfType.behaviors).foldL(aTry.success(result), function (result, method) {
                types.varnum = varnum;

                return result.flatmap(function() {
                    return expression.retrieveCallerType(environment, anEntity, method.name).flatmap(function (specification) {
                        return types.unfold(list(), environment, anEntity.param.type).flatmap(function (paramType) {
                            var callerType = option.some(method.caller).map(function(caller) {
                                    return types.unfold(list(), environment.allowModels(), caller).map(function (type) {
                                        return types.instantiate(type);
                                    });
                                }).orElse(aTry.success(paramType));

                            return callerType.flatmap(function (callerType) {                        
                                return types.unify(callerType, paramType).map(function (newSubstitutions) {
                                    return [types.substitute(newSubstitutions, callerType), specification];
                                });
                            });
                        });
                    }).flatmap(function (callerTypeAndspecification) {            
                        var callerType = callerTypeAndspecification[0],
                            specification = callerTypeAndspecification[1];

                        return types.unfold(list(), environment, specification).flatmap(function (unfoldType) {
                            var expectedType = types.neutralize(unfoldType),
                                behaviorBindings = list(pair(anEntity.param.name, callerType)).append(bindings);

                            return expressions.analyse(behaviorBindings, environment, method.definition, expectedType).flatmap(function() {
                                return result;
                            }); 
                        });
                    });
                });
            }); 
        });
    }

    function analyseExpression(environment, anEntity) {
        var expressionType = option.some(anEntity.type).map(function(aType) {
                return types.unfold(list(), environment, aType).map(function (unfoldType) {
                    return types.neutralize(unfoldType);
                });
            }).orElse(aTry.success(null));
        
        return expressionType.flatmap(function(expressionType) {
            return expressions.analyse(list(), environment, anEntity.expr, expressionType).map(function(result) {
                if (!anEntity.type) {
                    anEntity.type = types.generalize(types.substitute(result._1, result._2));
                } 

                return anEntity.type;
            });
        });
    }

    function analyseForall(environment, anEntity) {
        return types.unfold(list(), environment, types.neutralize(anEntity)).flatmap(function (unfoldType) {
            return analyseEntity(environment, unfoldType);
        });
    }
    
    function analyseEntity(environment, anEntity) {    
        switch (anEntity.$type) {
            case 'TypePolymorphic':
                return analyseForall(environment, anEntity);
                
            case 'Trait':
                return analyseTrait(environment, anEntity);
              
            case 'Controller':
                return analyseController(environment, anEntity);
              
            case 'Expression':
                return analyseExpression(environment, anEntity);                
                                
            default:
                return aTry.success(anEntity);
        }
    }
  
    Entities.prototype.analyse = function(environment, entities) {
        return list(entities).foldL(aTry.success(list()), function (result, anEntity) {
            types.reset();
                                                                    
            return result.flatmap(function (result) {
                return analyseEntity(environment, anEntity.definition).map(function() {
                    return result.add(anEntity);
                });
            });
        });        
    };
    
    return new Entities();
}());
    
    