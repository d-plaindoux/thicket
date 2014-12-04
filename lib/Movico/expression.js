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
    
    function expressionListVariables(variables, expressions, freeVariables) {
        expressions.forEach(function (expression) {
            freeVariables = expressionVariables(variables, expression, freeVariables);
        });
        return freeVariables;
    }
    
    function expressionVariables(variables, expression, freeVariables) {
        switch (type.get(expression)) {
            case 'NumberExpr':
                return freeVariables;

            case 'StringExpr':
                return freeVariables;
                
            case 'IdentExpr':
                if (variables.indexOf(expression.value) === -1) {
                    return freeVariables.concat([expression.value]);
                }
                return freeVariables;
                
            case 'InstanceExpr':
                return expressionListVariables(variables, expression.params, freeVariables);
            
            case 'InvokeExpr':
                return expressionListVariables(variables, [expression.caller, expression.body], freeVariables);
                
            case 'PairExpr':
                return expressionListVariables(variables, [expression.left, expression.right], freeVariables);
                
            case 'ApplicationExpr':
                return expressionListVariables(variables, [expression.abstraction, expression.argument], freeVariables);
                
            case 'ComprehensionExpr':
                var bound = variables;
                
                expression.iterations.forEach(function (iteration) {
                    bound = bound.concat([iteration[0]]);
                });
                       
                freeVariables = expressionVariables(bound, expression.value, freeVariables);

                expression.iterations.forEach(function (iteration) {
                    freeVariables = expressionVariables(variables, iteration[1], freeVariables);
                });
                       
                expression.conditions.forEach(function (condition) {
                    freeVariables = expressionVariables(variables, condition, freeVariables);
                });
                                                    
                return freeVariables;                                                     
                
            case 'TagExpr':
                expression.attributes.forEach(function (attribute) {
                    freeVariables = expressionVariables(variables, attribute[1], freeVariables);
                });
                
                expression.body.forEach(function (content) {
                    freeVariables = expressionVariables(variables, content, freeVariables);
                });                                
                                              
                return freeVariables;
                
            case 'UnitExpr':
                return freeVariables;
                
            case 'LetExpr':
                return expressionVariables(variables, 
                                           expression.value, 
                                           expressionVariables(variables.concat(expression.name), expression.body, freeVariables));
                                          
            default:
                return freeVariables;
        }
    }
    
    return {
        freeVariables : function (variables, expression) { return unique(expressionVariables(variables, expression, [])); }
    };
}());
    
    