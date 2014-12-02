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
                    return option.some(ast.type.fun(a.orElse(t.argument), r.orElse(t.result)));
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
    
    TypeChecker.prototype.expression = function (environment, expr) {
        switch (type.get(expr)) {
            case 'NumberExpr':
                return atry.success(ast.type.native('int'));
                
            case 'StringExpr':
                return atry.success(ast.type.native('string'));
                
            case 'IdentExpr':
                if (environment.hasOwnProperty(expr.value)) {
                    return atry.success(environment[expr.value]);
                } 
                
                return this.entities.find(expr.value).map(function (entity) {
                        return atry.success(entity);
                    }).
                    orElse(atry.failure("Identifier " + expr.value + " is unbound"));                
            
            case 'InstanceExpr':
                var model = this.entities.find(expr.name);
                
                if (!model.isPresent()){
                    return atry.failure(new Error("Model " + expr.name + " not found"));
                }
                
                if (model.get().params.length !== expr.params.length) {
                    return atry.failure(new Error("Parameter size mismatch"));
                }
                
                for(var i = 0; i < expr.params.length; i++) {
                    var paramType = this.expression(environment, expr.params[i]);
                    
                    if (paramType.isFailure()) {
                        return paramType;
                    }
                    
                    if (!this.unify(this.prune(paramType.success()), this.prune(model.get().params[0][1]))) {
                        return atry.failure(new Error(paramType.success + " is not a " + model.get().params[0][1]));
                    }
                }
                
                return atry.success(model.get());
                
            default:
                return atry.failure(new Error("Expression type error"));
        }
    };
    
    return function (entities) {
        return new TypeChecker(entities);    
    };
}());
    
    