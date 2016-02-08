/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var error = require('../exception.js'),
        list = require('../../../Data/list.js'),
        aTry = require('../../../Data/atry.js'),
        symbols = require('../symbols.js'),
        types = require('../checker/types.js'),
        stringify = require('../syntax/stringify.js');
    
    function Expression() {
        // Nothing for the moment
    }

    Expression.prototype.unify = function(expression, aType1, aType2, environment) {
        return types.unify(aType1, aType2, environment).map(function(result) {
            return aTry.success(result);
        }).lazyRecoverWith(function(anError) {
            return aTry.failure(error(expression, 
                                      anError.message,
                                      anError.name === "Abort"));
        });
    };

    Expression.prototype.retrieveBehaviorType = function (environment, entity, name) {
        var that = this;
        
        return types.unfold(list(), environment, entity).flatmap(function (definition) {
            var entity = types.instantiate(definition);

            switch (entity.$t) {
                case symbols.TypeSpecialize:
                    return types.reduce(entity).flatmap(function(entity) {
                        return that.retrieveBehaviorType(environment, entity, name);
                    });

                case symbols.Typedef:
                    return types.unfold(list(), environment, entity.type).flatmap(function (unfoldType) {
                        return that.retrieveBehaviorType(environment, unfoldType, name);
                    });
                    
                case symbols.EntitySpecialization:
                    return that.retrieveBehaviorType(environment, entity.type, name).map(function (aType) {
                        var variables = entity.type.variables.map(function(variable) { return variable.name; });
                        return types.substitute(list(variables).zipWith(list(entity.parameters)), aType);
                    });

                case symbols.Model:
                    return list(entity.params).findFirst(function (param) {
                        return param.name === name;
                    }).map(function (param) {
                        return types.unfold(list(), environment, param.type);
                    }).orLazyElse(function() {
                        return aTry.failure(error(entity, 
                                                  "definition '" + name + "' not found in " + 
                                                  stringify(types.reduce(entity,true).recoverWith(entity)), 
                                                  true));
                    });

                case symbols.Trait:
                case symbols.Controller: 
                    return list(entity.specifications).append(list(entity.behaviors)).findFirst(function (behavior) {
                        return behavior.name === name && behavior.type;
                    }).map(function (behavior) {
                        return types.unfold(list(), environment, behavior.type);
                    }).orLazyElse(function() {
                        var result = aTry.failure(error(entity, 
                                                        "definition '" + name + "' not found in " + 
                                                        stringify(types.reduce(entity,true).recoverWith(entity)), 
                                                        true));

                        return list(entity.derivations).foldL(result, function(result, derivation) {
                            if (result.isSuccess()) {
                                return result;
                            }

                            var newResult = that.retrieveBehaviorType(environment, derivation, name);
                            if (newResult.isSuccess()) {
                                return newResult;
                            } else {
                                return result;
                            }
                        });                            
                    });

                case symbols.TypeVariable:
                    return aTry.failure(error(entity, 
                                              "definition " + name + " not found in " + 
                                              stringify(types.reduce(entity,true).recoverWith(entity))));                            

                default: 
                    return aTry.failure(error(entity, 
                                              "definition " + name + " not found in " + 
                                              stringify(types.reduce(entity,true).recoverWith(entity)),
                                              true));
            }        
        });
    };
    
    Expression.prototype.retrieveModelType = function (environment, entity, name) {
        var that = this;

        return types.unfold(list(), environment, entity).flatmap(function (definition) {
            var entity = types.instantiate(definition);

            switch (entity.$t) {
                case symbols.TypeSpecialize:
                    return types.reduce(entity).flatmap(function(entity) {
                        return that.retrieveModelType(environment, entity, name);
                    });

                case symbols.EntitySpecialization:
                    return that.retrieveModelType(environment, entity.type, name).map(function (type) {
                        var variables = entity.type.variables.map(function(variable) { return variable.name; });
                        return types.substitute(list(variables).zipWith(list(entity.parameters)), type);
                    });

                case symbols.Model:
                    return list(entity.params).findFirst(function (param) {
                        return param.name === name;
                    }).map(function (param) {
                        return types.unfold(list(), environment, param.type).map(function (unfoldType) {
                            return types.instantiate(unfoldType);
                        });
                    }).orLazyElse(function() {
                        return aTry.failure(error(entity, 
                                                  "attribute '" + name + "' not found in " + 
                                                  stringify(types.reduce(entity,true).recoverWith(entity)), 
                                                  true));
                    });

                case symbols.Trait:
                case symbols.Controller:                            
                    return aTry.failure(error(entity, 
                                              stringify(types.reduce(entity,true).recoverWith(entity)) + 
                                              " is not a model. Attribute " + name + " not found", 
                                              true));     

                case symbols.Typedef:
                    return types.unfold(list(), environment, entity.type).flatmap(function (unfoldType) {
                        return that.retrieveModelType(environment, unfoldType, name);
                    });

                case symbols.TypeVariable:
                    return aTry.failure(error(entity, 
                                              "attribute " + name + " not found in " + 
                                              stringify(types.reduce(entity,true).recoverWith(entity))));                            

                default: 
                    return aTry.failure(error(entity, 
                                              "attribute " + name + " not found for " + 
                                              stringify(types.reduce(entity,true).recoverWith(entity)),
                                              true));
            }        
        });
    };

    return new Expression();
}());
    