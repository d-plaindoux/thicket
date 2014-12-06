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
                return atry.success(ast.type.native('int'));
                
            case 'StringExpr':
                return atry.success(ast.type.native('string'));
                
            case 'IdentExpr':                   
                var param = environment.filter(function (param) {
                    return param.name === expression.value;
                });
                
                if (param.length > 0) {
                    return atry.success(param[param.length - 1].type);
                } 
                
                return this.entities.find(expression.value).map(function (entity) {
                        return atry.success(entity);
                    }).
                    orElse(atry.failure("Identifier " + expression.value + " is unbound"));                
            
            case 'InstanceExpr':
                var model = this.entities.find(expression.name);
                
                if (!model.isPresent()){
                    return atry.failure(new Error("Model " + expression.name + " not found"));
                }
                
                if (model.get().params.length !== expression.params.length) {
                    return atry.failure(new Error("Parameter size mismatch"));
                }
                
                for(var i = 0; i < expression.params.length; i++) {
                    var paramType = this.expression(environment, variables, expression.params[i]);
                    
                    if (paramType.isFailure()) {
                        return paramType;
                    }
                    
                    if (!this.unify([], this.prune([], paramType.success()), this.prune([], model.get().params[0][1]))) {
                        return atry.failure(new Error(paramType.success + " is not a " + model.get().params[0][1]));
                    }
                }
                
                return atry.success(model.get());
                
            case 'PairExpr':
                return this.expression(environment, variables, expression.left).flatmap(function (first) {
                    return that.expression(environment, variables, expression.right).map(function (second) {
                        return ast.type.pair(first, second);
                    });
                });   
            
            case 'AbstractionExpr':
                var newEnvironment = environment.concat(expression.params);
                
                return this.expression(newEnvironment, variables, expression.body).map(function (type) {
                    var result = type; // fold right
                    expression.params.reverse().forEach(function (param) {
                        result = ast.type.abstraction(param.type, result);
                    });                     
                    return result;
                });
                
            case 'ApplicationExpr':
                return this.expression(environment, variables, expression.abstraction).flatmap(function (abstractionType) {
                    return that.expression(environment, variables, expression.argument).flatmap(function (argumentType) {
                        var result = ast.type.variable("'x"),
                            unification = that.unify([], ast.type.abstraction(argumentType, result), abstractionType);
                        if (unification.isPresent()) {
                            return atry.success(that.prune(unification.get(), result));
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
    
    