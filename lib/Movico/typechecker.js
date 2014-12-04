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
    
    function pruneType(t) {
        switch (type.get(t)) {
            case 'TypeIdent':
                return option.empty();
                
            case 'TypeVariable':
                return t.reference.map(function (t) {
                        return pruneType(t).orElse(t);
                    });
            case 'TypeArray':
                return pruneType(t.type).map(function (t) {
                            return ast.type.array(t);
                    });
                
            case 'TypePair': 
                var f = pruneType(t.first),
                    s = pruneType(t.second);                
                if (f.isPresent() || s.isPresent()) {
                    return option.some(ast.type.pair(f.orElse(t.first), s.orElse(t.second)));
                }                
                return option.empty();
            
            case 'TypeFunction': 
                var a = pruneType(t.argument),
                    r = pruneType(t.result);                
                if (a.isPresent() || r.isPresent()) {
                    return option.some(ast.type.abstraction(a.orElse(t.argument), r.orElse(t.result)));
                }                
                return option.empty();
            
            default:
                return option.empty();
        }
    }
            
    TypeChecker.prototype.prune = function (t) {
        return pruneType(t).orElse(t);
    };
    
    TypeChecker.prototype.unify = function (synthetized, expected) {
        switch (type.get(synthetized)) {
            case 'Model':
                switch (type.get(expected)) {
                    case 'Model':
                        return synthetized.name === expected.name;
                }
                return false;
            case 'Controller':
                switch (type.get(expected)) {
                    case 'Controller':
                        return synthetized.name === expected.name;
                }
                return false;
            case 'View':
                switch (type.get(expected)) {
                    case 'View':
                        return synthetized.name === expected.name;
                }
                return false;
            case 'TypeNative':
                switch (type.get(expected)) {
                    case 'TypeNative':
                        return synthetized.name === expected.name;
                }
                return false;
            case 'TypeIdent':
                switch (type.get(expected)) {
                    case 'TypeIdent':
                        return synthetized.name === expected.name;
                }
                return false;
            case 'TypeVariable':
                synthetized.bind(expected);
                return true;
            case 'TypePair':
                switch (type.get(expected)) {
                    case 'TypePair':
                        return this.unify(synthetized.first, expected.first) && 
                               this.unify(synthetized.second, expected.second);
                }
                return false;                
            case 'TypeFunction':
                switch (type.get(expected)) {
                    case 'TypeFunction':
                        return this.unify(synthetized.argument, expected.argument) && 
                               this.unify(synthetized.result, expected.result);
                }
                return false;                
            default:
                return false;
        }
    };
    
    TypeChecker.prototype.expression = function (environment, expression) {
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
                    var paramType = this.expression(environment, expression.params[i]);
                    
                    if (paramType.isFailure()) {
                        return paramType;
                    }
                    
                    if (!this.unify(this.prune(paramType.success()), this.prune(model.get().params[0][1]))) {
                        return atry.failure(new Error(paramType.success + " is not a " + model.get().params[0][1]));
                    }
                }
                
                return atry.success(model.get());
                
            case 'PairExpr':
                return this.expression(environment, expression.left).flatMap(function (first) {
                    return that.expression(environment, expression.right).map(function (second) {
                        return ast.type.pair(first, second);
                    });
                });   
            
            case 'AbstractionExpr':
                var newEnvironment = environment.concat(expression.params);
                
                return this.expression(newEnvironment, expression.body).map(function (type) {
                    var result = type; // fold right
                    expression.params.reverse().forEach(function (param) {
                        result = ast.type.abstraction(param.type, result);
                    });                     
                    return result;
                });
                
            default:
                return atry.failure(new Error("Expression type error"));
        }
    };
    
    return function (entities) {
        return new TypeChecker(entities);    
    };
}());
    
    