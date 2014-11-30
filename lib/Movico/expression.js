/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.expression = (function () {
    
    'use strict';
    
    var type = require('../Data/type.js').type;
    
    function unique(l) {
        var result = [];
        
        l.forEach(function (e) {
            if (result.indexOf(e) === -1) {
                result = result.concat([e]);
            }
        });
          
        return result;
    }
    
    function expressionListVariables(variables, expressions) {
        var freeVariables = [];
        expressions.forEach(function (expression) {
            freeVariables = freeVariables.concat(expressionVariables(variables, expression));
        });
        return unique(freeVariables);
    }
    
    function expressionVariables(variables, expression) {
        switch (type.get(expression)) {
            case 'NumberExpr':
                return [];

            case 'StringExpr':
                return [];
                
            case 'IdentExpr':
                if (variables.indexOf(expression.value) === -1) {
                    return [expression.value];
                }
                return [];
                
            case 'InstanceExpr':
                return expressionListVariables(variables, expression.params);
            
            case 'InvokeExpr':
                return expressionListVariables(variables, [expression.caller, expression.body]);
                
            case 'PairExpr':
                return expressionListVariables(variables, [expression.left, expression.right]);
                
            case 'ApplicationExpr':
                return expressionListVariables(variables, expression.expressions);
                
            case 'ComprehensionExpr':
                return [];
                
            case 'TagExpr':
                return [];
                
            case 'UnitExpr':
                return [];
                
            case 'LetExpr':
                return unique(expressionVariables(variables, expression.value).
                                concat(expressionVariables(variables.concat(expression.name), expression.body)));
                                          
            default:
                return [];
        }
    }
    
    return {
        freeVariables : expressionVariables
    };
}());
    
    