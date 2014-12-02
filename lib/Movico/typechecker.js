/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.typechecker = function (entities) {
    
    'use strict';
    
    var atry = require('../Data/atry.js').atry,
        type = require('../Data/type.js').type,
        ast = require('./ast.js').ast;
    
    function TypeChecker(entities) {
        this.entities = entities;
    }
           
    function objectEquals(obj1, obj2) {
        var i;
        for (i in obj1) {
            if (obj1.hasOwnProperty(i)) {
                if (!obj2.hasOwnProperty(i) || obj1[i] !== obj2[i]) {
                    return false;
                }
            }
        }
        for (i in obj2) {
            if (obj2.hasOwnProperty(i)) {
                if (!obj1.hasOwnProperty(i) || obj1[i] !== obj2[i]) {
                    return false;
                }
            }
        }
        return true;
    }
    
    TypeChecker.prototype.unifyTypes = function (synthetized, expected) {
        return objectEquals(synthetized, expected);
    };
    
    TypeChecker.prototype.expression = function (environment, expr) {
        switch (type.get(expr)) {
            case 'NumberExpr':
                return atry.success(ast.type.ident('int'));
                
            case 'StringExpr':
                return atry.success(ast.type.ident('string'));
                
            case 'IdentExpr':
                if (environment.hasOwnProperty(expr.value)) {
                    return atry.success(environment[expr.value]);
                } 
                
                var entity = entities.find(expr.value);
                
                if (entity.isPresent()) {
                    return atry.success(entity.get());
                }
                
                return atry.failure("Identifier " + expr.value + " is unbound");                    
            
            case 'InstanceExpr':
                var model = entities.find(expr.name);
                
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
                    
                    if (!this.unifyTypes(paramType.success(), model.get().params[0][1])) {
                        return atry.failure(new Error(paramType.success + " is not compatible with " + model.get().params[0][1]));
                    }
                }
                
                return atry.success(model.get());
                
            default:
                return atry.failure(new Error("Expression type error"));
        }
    };
    
    return new TypeChecker(entities);    
};
    
    