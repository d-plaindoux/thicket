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
    
    function pruneType(variables, t) {
        switch (type.get(t)) {
            case 'TypeIdent':
                return option.empty();
                
            case 'TypeVariable':  
                return option.some(variables.filter(function (param) {
                        return param.name === t.name;
                    })[0]).
                    map(function (t) {
                        return pruneType(variables, t.type).orElse(t.type);
                    });
                
            case 'TypeArray':
                return pruneType(variables, t.type).map(function (t) {
                            return ast.type.array(t);
                    });
                
            case 'TypePair': 
                var f = pruneType(variables, t.first),
                    s = pruneType(variables, t.second);                
                if (f.isPresent() || s.isPresent()) {
                    return option.some(ast.type.pair(f.orElse(t.first), s.orElse(t.second)));
                }                
                return option.empty();
            
            case 'TypeFunction': 
                var a = pruneType(variables, t.argument),
                    r = pruneType(variables, t.result);                
                if (a.isPresent() || r.isPresent()) {
                    return option.some(ast.type.abstraction(a.orElse(t.argument), r.orElse(t.result)));
                }                
                return option.empty();
            
            default:
                return option.empty();
        }
    }
            
    TypeChecker.prototype.prune = function (variables, t) {
        return pruneType(variables, t).orElse(t);
    };
    
    TypeChecker.prototype.unify = function (variables, synthetized, expected) {
        var that = this;
        switch (type.get(synthetized)) {
            case 'Model':
                switch (type.get(expected)) {
                    case 'Model':
                        if (synthetized.name === expected.name) {
                            return option.some(variables);
                        }
                }
                return option.empty();
            case 'Controller':
                switch (type.get(expected)) {
                    case 'Controller':
                        if (synthetized.name === expected.name) {
                            return option.some(variables);
                        }
                }
                return option.empty();
            case 'View':
                switch (type.get(expected)) {
                    case 'View':
                        if (synthetized.name === expected.name) {
                            return option.some(variables);
                        }
                }
                return option.empty();
            case 'TypeNative':
                switch (type.get(expected)) {
                    case 'TypeNative':
                        if (synthetized.name === expected.name) {
                            return option.some(variables);
                        }
                }
                return option.empty();
            case 'TypeIdent':
                switch (type.get(expected)) {
                    case 'TypeIdent':
                        if (synthetized.name === expected.name) {
                            return option.some(variables);
                        }
                }
                return option.empty();
            case 'TypeVariable':
                return option.some(variables.concat([ast.param(synthetized.name, expected)]));
            case 'TypePair':
                switch (type.get(expected)) {
                    case 'TypePair':
                        return that.unify(variables, synthetized.first, expected.first).flatmap(function (variables) {
                            return that.unify(variables, synthetized.second, expected.second);
                        });
                }
                return option.empty();
            case 'TypeFunction':
                switch (type.get(expected)) {
                    case 'TypeFunction':
                        return that.unify(variables, synthetized.argument, expected.argument).flatmap(function (variables) {
                            return that.unify(variables, synthetized.result, expected.result);
                        });
                }
                return option.empty();
            default:
                return option.empty();
        }
    };
    
    TypeChecker.prototype.expression = function (environment, variables, expression) {
        var that = this;
        
        switch (type.get(expression)) {
            case 'NumberExpr':
                return atry.success(pair([], ast.type.native('int')));
                
            case 'StringExpr':
                return atry.success(pair([], ast.type.native('string')));
                
            case 'IdentExpr':                   
                var param = environment.filter(function (param) {
                    return param.name === expression.value;
                });
                
                if (param.length > 0) {
                    return atry.success(pair(variables, param[param.length - 1].type));
                } 
                
                return this.entities.find(expression.value).map(function (entity) {
                        return atry.success(pair(variables, entity));
                    }).
                    orElse(atry.failure("Identifier " + expression.value + " is unbound"));                
            
            case 'InstanceExpr':
                var model = this.entities.find(expression.name),
                    newVariables = variables;
                
                if (!model.isPresent()){
                    return atry.failure(new Error("Model " + expression.name + " not found"));
                }
                
                if (model.get().params.length !== expression.params.length) {
                    return atry.failure(new Error("Parameter size mismatch"));
                }
                
                for(var i = 0; i < expression.params.length; i++) {
                    var paramType = this.expression(environment, newVariables, expression.params[i]),
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
                    
                    newVariables = unification.get();
                }
                
                return atry.success(pair(newVariables, model.get()));
                
            case 'PairExpr':
                return this.expression(environment, variables, expression.left).flatmap(function (first) {
                    return that.expression(environment, first._1, expression.right).map(function (second) {
                        return pair(second._1, ast.type.pair(first._2, second._2));
                    });
                });   
            
            case 'AbstractionExpr':
                var newEnvironment = environment.concat(expression.params);
                
                return this.expression(newEnvironment, variables, expression.body).map(function (result) {
                    var type = result._2; // fold right
                    expression.params.reverse().forEach(function (param) {
                        type = ast.type.abstraction(param.type, type);
                    });                     
                    return pair(result._1, type);
                });
                
            case 'ApplicationExpr':
                return this.expression(environment, variables, expression.abstraction).flatmap(function (abstractionType) {
                    return that.expression(environment, abstractionType._1, expression.argument).flatmap(function (argumentType) {
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
    
    