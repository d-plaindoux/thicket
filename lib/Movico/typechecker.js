/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.typechecker = (function () {
    
    'use strict';
    
    var atry = require('../Data/atry.js').atry,
        option = require('../Data/option.js').option,
        pair = require('../Data/pair.js').pair,
        type = require('../Data/type.js').type,
        ast = require('./ast.js').ast;
    
    function TypeChecker(entities) {
        this.entities = entities;
    }
    
    function pruneType(bindings, t) {
        switch (type.get(t)) {
            case 'TypeVariable':  
                return option.some(bindings.filter(function (binding) {
                        return binding._1 === t.name;
                    })[0]).
                    map(function (binding) {
                        return binding._2;
                    });
            
            default:
                return option.empty();
        }
    }
            
    TypeChecker.prototype.prune = function (variables, t) {
        return pruneType(variables, t).orElse(t);
    };
    
    TypeChecker.prototype.unify = function (bindings, synthetizedNP, expectedNP) {        
        var that = this,
            synthetized = this.prune(bindings, synthetizedNP),
            expected = this.prune(bindings, expectedNP);
        
        switch (type.get(synthetized)) {
            case 'Model':
                switch (type.get(expected)) {
                    case 'Model':
                        if (synthetized.name === expected.name) {
                            return option.some(bindings);
                        }
                }
                return option.empty();
            case 'Controller':
                switch (type.get(expected)) {
                    case 'Controller':
                        if (synthetized.name === expected.name) {
                            return option.some(bindings);
                        }
                }
                return option.empty();
            case 'View':
                switch (type.get(expected)) {
                    case 'View':
                        if (synthetized.name === expected.name) {
                            return option.some(bindings);
                        }
                }
                return option.empty();
            case 'TypeNative':
                switch (type.get(expected)) {
                    case 'TypeNative':
                        if (synthetized.name === expected.name) {
                            return option.some(bindings);
                        }
                }
                return option.empty();
            case 'TypeVariable':
                return option.some(bindings.concat([pair(synthetized.name, expected)]));
            case 'TypePair':
                switch (type.get(expected)) {
                    case 'TypePair':
                        return that.unify(bindings, synthetized.first, expected.first).flatmap(function (bindings) {
                            return that.unify(bindings, synthetized.second, expected.second);
                        });
                }
                return option.empty();
            case 'TypeFunction':
                switch (type.get(expected)) {
                    case 'TypeFunction':
                        return that.unify(bindings, synthetized.argument, expected.argument).flatmap(function (bindings) {
                            return that.unify(bindings, synthetized.result, expected.result);
                        });
                }
                return option.empty();
            default:
                return option.empty();
        }
    };
    
    TypeChecker.prototype.expression = function (bindings, expression) {
        var that = this, newBindings;
        
        switch (type.get(expression)) {
            case 'NumberExpr':
                return atry.success(pair([], ast.type.native('int')));
                
            case 'StringExpr':
                return atry.success(pair([], ast.type.native('string')));
                
            case 'IdentExpr':                   
                var binding = bindings.filter(function (binding) {
                    return binding._1 === expression.value;
                });
                
                if (binding.length > 0) {
                    return atry.success(pair(bindings, binding[0]._2));
                } 
                
                return this.entities.find(expression.value).map(function (entity) {
                        return atry.success(pair(bindings, entity));
                    }).
                    orElse(atry.failure("Identifier " + expression.value + " is unbound"));                
            
            case 'InstanceExpr':
                var model = this.entities.find(expression.name);
                
                newBindings = bindings;
                
                if (!model.isPresent()){
                    return atry.failure(new Error("Model " + expression.name + " not found"));
                }
                
                if (model.get().params.length !== expression.params.length) {
                    return atry.failure(new Error("Parameter size mismatch"));
                }
                
                for(var i = 0; i < expression.params.length; i++) {
                    var paramType = this.expression(bindings, expression.params[i]),
                        unification;
                    
                    if (paramType.isFailure()) {
                        return paramType;
                    }
                    
                    unification = this.unify(paramType.success()._1, 
                                             this.prune(paramType.success._1, paramType.success()._2), 
                                             this.prune(paramType.success._1, model.get().params[0][1]));
                    
                    if (!unification.isPresent()) {
                        return atry.failure(new Error(paramType.success + " is not a " + model.get().params[0][1]));
                    }
                    
                    newBindings = unification.get();
                }
                
                return atry.success(pair(newBindings, model.get()));
                
            case 'PairExpr':
                return this.expression(bindings, expression.left).flatmap(function (first) {
                    return that.expression(first._1, expression.right).map(function (second) {
                        return pair(second._1, ast.type.pair(first._2, second._2));
                    });
                });   
            
            case 'AbstractionExpr':
                newBindings = bindings;
                
                expression.params.forEach(function (param) {
                    newBindings = [pair(param.name, param.type)].concat(newBindings);
                });
                
                return this.expression(newBindings, expression.body).map(function (result) {
                    var type = result._2; // fold right
                    expression.params.reverse().forEach(function (param) {
                        type = ast.type.abstraction(param.type, type);
                    });                     
                    return pair(result._1, type);
                });
                
            case 'ApplicationExpr':
                return this.expression(bindings, expression.abstraction).flatmap(function (abstractionType) {
                    return that.expression(abstractionType._1, expression.argument).flatmap(function (argumentType) {
                        var result = ast.type.variable("'x"),
                            unification = that.unify(argumentType._1, ast.type.abstraction(argumentType._2, result), abstractionType._2);
                        if (unification.isPresent()) {
                            return atry.success(pair(unification.get(), that.prune(unification.get(), result)));
                        } else {
                            return atry.failure(new Error("Expression type error"));
                        }
                    });
                });                
                
            default:
                return atry.failure(new Error("Expression type error"));
        }
    };
    
    return function (entities) {
        return new TypeChecker(entities);    
    };
}());
    
    