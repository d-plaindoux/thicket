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
    
    function Expressions() {
        // Nothing for the moment
    }
    
    Expressions.prototype.analyse = function (variables, expression) {
        var that = this;
        
        switch (type.get(expression)) {
            case 'NumberExpr':
                return aTry.success(pair(list(),ast.type.native('number')));

            case 'StringExpr':
                return aTry.success(pair(list(),ast.type.native('string')));
                
            case 'IdentExpr':
                return variables.findFirst(function (binding) {
                    return binding.name === expression.value;                      
                }).map(function (binding) {
                    return aTry.success(pair(list(), binding.type));
                }).orElse(aTry.failure(new Error("Unbound variable " + expression.name)));
                
            case 'InstanceExpr':
                return aTry.failure(new Error("InstanceExpr"));
            
            case 'InvokeExpr':
                return aTry.failure(new Error("InvokeExpr"));
                
            case 'PairExpr':
                return that.analyse(variables, expression.left).flatmap(function (variablesAndLeft) {
                    return that.analyse(variablesAndLeft._1, expression.right).map(function (variablesAndRight) {
                        return pair(variablesAndRight._1, ast.type.pair(variablesAndLeft._2, variablesAndRight._2));
                    });
                });
                
            case 'ApplicationExpr':
                return aTry.failure(new Error("ApplicationExpr"));
                
            case 'ComprehensionExpr':
                return aTry.failure(new Error("ComprehensionExpr"));
                
            case 'TagExpr':
                return aTry.failure(new Error("TagExpr"));
                
            case 'UnitExpr':
                return aTry.failure(new Error("UnitExpr"));
                
            case 'LetExpr':
                return aTry.failure(new Error("LetExpr"));
                
            case 'AbstractionExpr':
                return aTry.failure(new Error("AbstractionExpr"));
                                          
            default:
                return aTry.failure(new Error(type.get(expression)));
        }
    };
    
    return new Expressions();
}());
    
    