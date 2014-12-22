/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.expressions = (function () {
    
    'use strict';
    
    var type = require('../Data/type.js').type,
        list = require('../Data/list.js').list,
        pair = require('../Data/pair.js').pair,
        aTry = require('../Data/atry.js').atry,
        ast  = require('./ast.js').ast;
    
    function unique(l) {
        return l.foldL(list(), function (l, e) {
            if (!l.contains(e)) {
                return l.add(e);
            }
            return l;
        });
    }
    
    function expressionListVariables(variables, expressions, freeVariables) {
        return expressions.foldL(freeVariables, function (freeVariables, expression) {
            return expressionVariables(variables, expression, freeVariables);
        });
    }
    
    function expressionVariables(variables, expression, freeVariables) {
        var newFreeVariables, newVariables;
        
        switch (type.get(expression)) {
            case 'NumberExpr':
                return freeVariables;

            case 'StringExpr':
                return freeVariables;
                
            case 'IdentExpr':
                if (!variables.contains(expression.value)) {
                    return freeVariables.add(expression.value);
                }
                return freeVariables;
                
            case 'InstanceExpr':
                return expressionListVariables(variables, list(expression.params), freeVariables);
            
            case 'InvokeExpr':
                return expressionListVariables(variables, list(expression.caller, expression.body), freeVariables);
                
            case 'PairExpr':
                return expressionListVariables(variables, list(expression.left, expression.right), freeVariables);
                
            case 'ApplicationExpr':
                return expressionListVariables(variables, list(expression.abstraction, expression.argument), freeVariables);
                
            case 'ComprehensionExpr':
                newVariables = list(expression.iterations).foldL(variables, function (variables, iteration) {
                    return variables.add(iteration[0]);
                });
                       
                newFreeVariables = expressionVariables(newVariables, expression.value, freeVariables);
                newFreeVariables = list(expression.iterations).foldL(newFreeVariables, function (freeVariables, iteration) {
                    return expressionVariables(variables, iteration[1], freeVariables);
                });
                newFreeVariables = list(expression.conditions).foldL(newFreeVariables, function (freeVariables, condition) {
                    return expressionVariables(variables, condition, freeVariables);
                });
                                                    
                return newFreeVariables;                                                     
                
            case 'TagExpr':
                newFreeVariables = list(expression.attributes).foldL(freeVariables, function (freeVariables, attribute) {
                    return expressionVariables(variables, attribute[1], freeVariables);
                });
                newFreeVariables = list(expression.body).foldL(newFreeVariables, function (freeVariables, content) {
                    return expressionVariables(variables, content, freeVariables);
                });                                
                                              
                return newFreeVariables;
                
            case 'UnitExpr':
                return freeVariables;
                
            case 'LetExpr':
                return expressionVariables(variables, 
                                           expression.value, 
                                           expressionVariables(variables.add(expression.name), expression.body, freeVariables));
                                          
            default:
                return freeVariables;
        }
    }
    
    function analyse(variables, expression) {
        switch (type.get(expression)) {
            case 'NumberExpr':
                return aTry.success(pair(list(),ast.type.native('number')));

            case 'StringExpr':
                return aTry.success(pair(list(),ast.type.native('string')));
                
            case 'IdentExpr':
                return variables.findFirst(function (binding) {
                    return binding._1 === expression.name;                      
                }).flatmap(function (binding) {
                    return aTry.success(variables, binding._2);
                }).orElse(aTry.failure(new Error("Unbound variable " + expression.name)));
                
            case 'InstanceExpr':
                return aTry.failure(new Error("NI"));
            
            case 'InvokeExpr':
                return aTry.failure(new Error("NI"));
                
            case 'PairExpr':
                return aTry.failure(new Error("NI"));
                
            case 'ApplicationExpr':
                return aTry.failure(new Error("NI"));
                
            case 'ComprehensionExpr':
                return aTry.failure(new Error("NI"));
                
            case 'TagExpr':
                return aTry.failure(new Error("NI"));
                
            case 'UnitExpr':
                return aTry.failure(new Error("NI"));
                
            case 'LetExpr':
                return aTry.failure(new Error("NI"));
                                          
            default:
                return aTry.failure(new Error("NI"));
        }
    }
    
    return {
        freeVariables : function (variables, expression) { return unique(expressionVariables(variables, expression, list())); },
        analyse : function (variables, expression) { return analyse(variables, expression); },
    };
}());
    
    