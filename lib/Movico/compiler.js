/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

/* QUICK AND DIRTY transpiler -- for validation purpose only */

exports.compiler = (function () {
    
    'use strict';
    
    var reflect = require('../Data/reflect.js').reflect,
        aTry    = require('../Data/atry.js').atry,
        list    = require('../Data/list.js').list,
        ast     = require('./ast.js').ast;
            
    function compileModel(model) {        
        var body = 
            list(model.params).foldL("$ : '" + model.name + "'", function (result,param) {
                return result + ", '" + param.name + "': mvc$" + param.name;
            });
        
        body = list(model.params).foldR(function (param, result) {
            return "function (mvc$" + param.name + ") { return " + result + "}";
        }, "{" + body + "}");
        
        return aTry.success("var mvc$" + model.name + " = " + body + ";");
    }
    
    function compileExpression(environment, expression) {
        var result, newExpression;
        
        switch (reflect.typeof(expression)) {
            case 'NumberExpr':            
                result = aTry.success(expression.value);
                break;
            case 'StringExpr':
                result = aTry.success("'" + expression.value + "'");
                break;
            case 'UnitExpr':
                result = aTry.success("null");
                break;
            case 'IdentExpr':
                result = aTry.success("mvc$" + expression.value);
                break;
            case 'InvokeExpr':
                result = compileExpression(expression.caller).map(function (caller) {
                    return caller + "[" + expression.name + "]";
                });
                break;
            case 'PairExpr': 
                result = compileExpression(expression.left).flatmap(function (left) {
                    return compileController(environment, expression.right).map(function (right) {
                        return "Pair(" + left + ")(" + right + ")";
                    });
                });
                break;
            case 'ApplicationExpr':
                if (reflect.typeof(expression.argument) === 'IdentExpr' && 
                    !environment.findFirst(function (binding) { return binding._1 === expression.argument.value;}).isPresent()) {  
                    newExpression = ast.expr.invoke(expression.abstraction, expression.argument.value);                
                    result = compileExpression(environment, newExpression);
                } else {
                    result = compileExpression(expression.abstraction).flatmap(function (abstraction) {
                        return compileController(environment, expression.param).map(function (param) {
                            return abstraction + "(" + param + ")";
                        });
                    });
                }                
                
                break;
            case 'ComprehensionExpr':
                var iteration = expression.iterations[0],
                    iterations = expression.iterations.splice(1);

                newExpression = list(expression.conditions).foldL(iteration[1], function(expression, condition) {
                    return ast.expr.application(ast.expr.invoke(expression,"filter"),
                                                ast.expr.abstraction(iteration[0],condition));
                });
            
                newExpression = ast.expr.application(ast.expr.invoke(newExpression, "map"),
                                                     ast.expr.abstraction(iteration[0], expression.value));
        
                newExpression = list(iterations).foldL(newExpression, function (expression, iteration) {
                    return ast.expr.application(ast.expr.invoke(iteration[1], "flatmap"),
                                                ast.expr.abstraction(iteration[0], expression));
                });                        
                result = compileExpression(environment, newExpression);
                break;
            case 'TagExpr': 
                result = aTry.success("TBD");
                break;
            case 'LetExpr':
                newExpression = ast.expr.application(ast.expr.abstraction(expression.name, 
                                                                          expression.body,
                                                                          expression.type),
                                                     expression.value);
                result = compileExpression(environment,newExpression); 
                break;
            case 'AbstractionExpr':
                result = aTry.success("TBD");
                break;
            default:
                result = aTry.failure(new Error(reflect.typeof(expression)));
        }

        return result;
    }    
    
    function compileController(environment, controller) {                
        var result = list(controller.behaviors).foldL(aTry.success("$: '"+ controller.name + "'"), function (result,behavior) {
            return result.flatmap(function(result) {
                return compileExpression(environment, behavior.definition).map(function (expression) {
                    return result + ", '" + behavior.name + "': " + expression;                    
                });
            });
        });
        
        return result.map(function (result) {
            return "var mvc$" + controller.name + " = function (mvc$" + controller.param.name + ") { return {" + result + "}; };";
        });
    }
    
    function compileView() {        
        return aTry.failure(new Error("NYI"));
    }
    
    return {
        model : compileModel,
        controller: compileController,
        view: compileView
    };

}());