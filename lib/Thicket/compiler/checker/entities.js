/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
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
        ast = require('../syntax/ast.js'),
        stringify = require('../syntax/stringify.js'),
        symbols = require('../symbols.js'),
        types = require('./types.js'),
        expression = require('./expression.js'),
        expressions = require('./expressions.js');

    function Entities() {
        // Nothing for the moment
    }
    
    function unify(anExpression, aType1, aType2, environment) {
        return expression.unify(anExpression, aType1, aType2, environment); 
    }

    function checkExhaustivity(anEntity) {
        return aTry.success(anEntity);
    }
    
    function checkDerivations(environment, anEntity, visited) {
        if (visited.contains(anEntity.name)) {
            return aTry.failure(error(anEntity, 
                                      "Cyclic specification for " + 
                                      stringify(types.reduce(anEntity,true).recoverWith(anEntity)), true));
        }
        
        return list(anEntity.derivations).foldL(aTry.success(anEntity), function (result, derivation) {
            return result.flatmap(function() {
                return types.unfold(list(), environment, derivation).flatmap(function (unfoldType) {
                    return types.reduce(unfoldType).flatmap(function (definition) {
                        if (definition.$t === symbols.Model) {
                            return result;
                        } else if (definition.$t === symbols.EntitySpecialization && definition.type.$t === symbols.Model) {
                            return result;
                        } else if (definition.$t === symbols.Trait) {
                            return checkDerivations(environment, definition, visited.add(anEntity.name));
                        } else if (definition.$t === symbols.EntitySpecialization && definition.type.$t === symbols.Trait) {
                            return checkDerivations(environment, definition.type, visited.add(anEntity.name));
                        } else {
                            return aTry.failure(error(anEntity, stringify(derivation) + " must be a model or a trait"));
                        }
                    });
                });
            });
        });
    }
       
    function analyseTrait(environment, anEntity) {
        var bindings = list(
                pair("self", ast.specialization(anEntity,anEntity.variables))
            ),
            varnum = types.varnum;
        
        // Check | derivations must be models or traits
        return checkDerivations(environment, anEntity, list()).flatmap(function(result) {
            return list(anEntity.behaviors).foldL(aTry.success(result), function (result, method) {
                types.varnum = varnum;

                return result.flatmap(function() {
                    return expression.retrieveBehaviorType(environment, anEntity, method.name).flatmap(function (specification) {
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
        var bindings = list(
                pair("self", ast.specialization(anEntity,anEntity.variables))
            ),
            varnum = types.varnum;
        
        // Check | derivations must be models or traits
        return checkDerivations(environment, anEntity, list()).flatmap(function(result) {
            return list(anEntity.behaviors).foldL(aTry.success(result), function (result, method) {
                types.varnum = varnum;

                return result.flatmap(function() {
                    return expression.retrieveBehaviorType(environment, anEntity, method.name).flatmap(function (specification) {
                        return types.unfold(list(), environment, anEntity.param.type).flatmap(function (paramType) {
                            var callerType = option.some(method.caller).map(function(caller) {
                                    return types.unfold(list(), environment.allowModels(), caller).map(function (type) {
                                        return types.instantiate(type);
                                    });
                                }).orElse(aTry.success(paramType));

                            return callerType.flatmap(function (callerType) {                        
                                return unify(method, callerType, paramType, environment).map(function (newSubstitutions) {
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
            }).flatmap(function() {
                /*
                var paramType = types.unfold(list(), environment, anEntity.param.type).flatmap(function (paramType) {
                        return types.reduce(paramType, true);
                    }).recoverWith(anEntity.param.type),
                    models = paramType.$t === symbols.Model ? paramType.abstract : [];
                */
            
                return checkExhaustivity(anEntity);
                // return aTry.success(result);
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
    
    function analyseEntitySpecialization(environment, anEntity) {        
        var variables = anEntity.type.variables.map(function(variable) { return variable.name; }),
            newEntity = types.substitute(list(variables).zipWith(list(anEntity.parameters)), anEntity.type);
        return analyseEntity(environment, newEntity);
    }
    
    function analyseTypedef(environment, aType) {
        return types.unfold(list(), environment, aType).map(function() {
            return aType; // TODO
        });
    }
    
    function analyseEntity(environment, anEntity) {    
        switch (anEntity.$t) {
            case symbols.TypePolymorphic:
                return analyseForall(environment, anEntity);
                
            case symbols.EntitySpecialization:
                return analyseEntitySpecialization(environment, anEntity);
                
            case symbols.Trait:
                return analyseTrait(environment, anEntity);
              
            case symbols.Controller:
                return analyseController(environment, anEntity);
              
            case symbols.Expression:
                return analyseExpression(environment, anEntity);
                
            case symbols.Typedef:
                return analyseTypedef(environment, anEntity);
                
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
    
    