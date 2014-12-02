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
        type = require('../Data/type.js').type,
        ast = require('./ast.js').ast;
    
    function TypeChecker(entities) {
        this.entities = entities;
    }
    
    TypeChecker.prototype.prune = function (t) {
        switch (type.get(t)) {
            case 'TypeIdent':
                if (t.reference) {
                    return this.prune(t.reference);
                }
                return t;
                
            case 'TypeArray':
                var p = this.prune(t.value);
                if (p !== t.value) {
                    return ast.type.array(p);
                }
                return t;
                
            case 'TypePair': 
                var f = this.prune(t.first),
                    s = this.prune(t.second);                
                if (f !== t.first || s !== t.second) {
                    return ast.type.pair(f, s);
                }                
                return t;
            
            case 'TypeFunction': 
                var a = this.prune(t.argument),
                    r = this.prune(t.result);                
                if (a !== t.argument || r !== t.result) {
                    return ast.type.fun(a,r);
                }                
                return t;
            
            default:
                return t;
        }
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
            case 'TypeIdent':
                synthetized.reference = expected;
                return true;
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
                
                var entity = this.entities.find(expr.value);
                
                if (entity.isPresent()) {
                    return atry.success(entity.get());
                }
                
                return atry.failure("Identifier " + expr.value + " is unbound");                    
            
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
    
    