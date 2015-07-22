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
        option = require('../../../Data/option.js'),
        aTry = require('../../../Data/atry.js'),
        list = require('../../../Data/list.js'),
        pair = require('../../../Data/pair.js'),
        types = require('../checker/types.js'),
        stringify = require('../syntax/stringify.js'),
        expressions = require('../checker/expressions.js');

    function Entities() {
        // Nothing for the moment
    }
                 
    function unify(aType1, aType2) {
        return types.unify(aType1, aType2).map(function (result) {
            return aTry.success(result);
        }).lazyRecoverWith(function () {
            return aTry.failure(new Error("Cannot unify " + stringify(aType1) + " and " + stringify(aType2)));
        });
    }
   
    function analyseController(environment, anEntity) {
        var selfType = anEntity,
            bindings = list(pair("self", selfType)),
            varnum = types.varnum;
        
        return list(selfType.behaviors).foldL(aTry.success(anEntity), function (result, method) {
            types.varnum = varnum;
            
            return result.flatmap(function() {
                return list(anEntity.specifications).findFirst(function (specification) {
                    return specification.name === method.name;
                }).map(function (specification) {
                    return aTry.success(specification);
                }).orElse(aTry.failure(error(anEntity, "Specification not found for " + method.name))).flatmap(function (specification) {
                    return types.unfold(list(), environment, anEntity.param.type).flatmap(function (paramType) {
                        var callerType = option.some(method.caller).map(function(caller) {
                                return types.unfold(list(), environment.allowModels(), caller).map(function (type) {
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
                    
                    return types.unfold(list(), environment, specification.type).flatmap(function (unfoldType) {
                        var expectedType = types.neutralize(unfoldType),
                            behaviorBindings = list(pair(anEntity.param.name, callerType)).append(bindings);
                        
                        return expressions.analyse(behaviorBindings, environment, method.definition, expectedType).flatmap(function() {
                            return result;
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
    
    