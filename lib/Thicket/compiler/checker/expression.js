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
        list = require('../../../Data/list.js'),
        aTry = require('../../../Data/atry.js'),
        types = require('../checker/types.js'),
        stringify = require('../syntax/stringify.js');
    
    function Expression() {
        // Nothing for the moment
    }

    Expression.prototype.retrieveCallerType = function (environment, entity, name) {
        var that = this;
        
        return types.unfold(list(), environment, entity).flatmap(function (unfoldType) {
            return types.reduce(unfoldType).flatmap(function (definition) {
                var entity = types.instantiate(definition);
                
                switch (entity.$type) {
                    case 'TypeSpecialize':
                        return that.retrieveCallerType(environment, entity, name);
                        
                    case 'Typedef':
                        return types.unfold(list(), environment, entity.type).flatmap(function (unfoldType) {
                            return that.retrieveCallerType(environment, unfoldType, name);
                        });

                    case 'Model':
                        return list(entity.params).findFirst(function (param) {
                            return param.name === name;
                        }).map(function (param) {
                            return types.unfold(list(), environment, param.type);
                        }).orLazyElse(function() {
                            return aTry.failure(error(entity, 
                                                      "definition '" + name + "' not found in " + stringify(entity), 
                                                      true));
                        });

                    case 'Controller':                            
                        return list(entity.specifications).findFirst(function (behavior) {
                            return behavior.name === name;
                        }).map(function (behavior) {
                            return types.unfold(list(), environment, behavior.type);
                        }).orLazyElse(function() {
                            var result = aTry.failure(error(entity, 
                                                      "definition '" + name + "' not found in " + stringify(entity), 
                                                      true));
                            
                            return list(entity.derivations).foldL(result, function(result, derivation) {
                                if (result.isSuccess()) {
                                    return result;
                                }
                                    
                                var newResult = that.retrieveCallerType(environment, derivation, name);
                                if (newResult.isSuccess()) {
                                    return newResult;
                                } else {
                                    return result;
                                }
                            });                            
                        });
                        
                    case 'TypeVariable':
                        return aTry.failure(error(entity, 
                                                  "definition " + name + " not found for " + stringify(entity)));                            

                    default: 
                        return aTry.failure(error(entity, 
                                                  "definition " + name + " not found for " + stringify(entity),
                                                  true));
                }        
            });
        });
    };

    return new Expression();
}());
    