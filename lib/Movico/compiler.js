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
            list(model.params).foldL("$:'" + model.name + "'", function (result,param) {
                return result + ",'" + param.name + "':mvc$" + param.name;
            });
        
        body = list(model.params).foldR(function (param, result) {
            return "function(mvc$" + param.name + "){return " + result + ";}";
        }, "M.instance({" + body + "})");
        
        return aTry.success("M.define('" + model.name + "'," + body + ")");
    }
    
    function compileExpression(environment, variables, expression) {
        var result, newExpression;
        
        switch (reflect.typeof(expression)) {
            case 'NumberExpr': // OK 
                result = aTry.success("M.number(" + expression.value + ")");
                break;
            case 'StringExpr': // OK
                result = aTry.success("M.string('" + expression.value + "')");
                break;
            case 'UnitExpr': // OK
                result = aTry.success("M.unit");
                break;
            case 'IdentExpr': // OK
                if (variables.contains(expression.value)) {
                    result = aTry.success("mvc$" + expression.value);
                } else {
                    result = aTry.success("M.ident('" + expression.value + "')");
                }
                break;
            case 'InvokeExpr': // OK
                result = compileExpression(environment, variables, expression.caller).map(function (caller) {
                    return "M.invoke(" + caller + ",'" + expression.name + "')";
                });
                break;
            case 'PairExpr': // OK
                newExpression = ast.expr.application(ast.expr.application(ast.expr.ident("Pair"), expression.left),expression.right);
                result = compileExpression(environment, variables, newExpression);
                break;
            case 'ApplicationExpr': // OK
                if (reflect.typeof(expression.argument) === 'IdentExpr' && 
                    !environment.contains(expression.argument.value) && 
                    !variables.contains(expression.argument.value)) {  
                    newExpression = ast.expr.invoke(expression.abstraction, expression.argument.value);                
                    result = compileExpression(environment, variables, newExpression);
                } else {
                    result = compileExpression(environment, variables, expression.abstraction).flatmap(function (abstraction) {
                        return compileExpression(environment, variables, expression.argument).map(function (argument) {
                            return "M.apply(" + abstraction + ",M.lazy(function(){return " + argument + ";}))";
                        });
                    });
                }                
                
                break;
            case 'ComprehensionExpr': // OK
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
                result = compileExpression(environment, variables, newExpression);
                break;
            case 'TagExpr': 
                result = list(expression.attributes).foldL(aTry.success(list()),function (result, attribute) {
                    return result.flatmap(function (result) {
                        return compileExpression(environment, variables, attribute[1]).map(function (value) {
                            return result.add(["['" + attribute[0] +"',"+ value + "]"]);
                        });
                    });
                }).flatmap(function (attributes) {
                    return list(expression.body).foldL(aTry.success(list()),function (result,body) {
                        return result.flatmap(function (result) {
                            return compileExpression(environment,variables,body).map(function (body) {
                                return result.add(body);
                            });
                        });
                    }).map(function (body) {
                        return "M.tag('" + expression.name + "',["+ attributes.value.join(',') +"],["+body.value.join(',')+"])";
                    });
                });
                break;
            case 'LetExpr': // OK
                newExpression = ast.expr.application(ast.expr.abstraction(expression.name, 
                                                                          expression.body,
                                                                          expression.type),
                                                     expression.value);
                result = compileExpression(environment, variables, newExpression); 
                break;
            case 'AbstractionExpr': // OK
                result = compileExpression(environment, variables.add(expression.param), expression.body).map(function (body) {
                    return "function(mvc$" + expression.param + "){return " + body + ";}";
                });
                break;
            default:
                result = aTry.failure(new Error(reflect.typeof(expression)));
        }

        return result;
    }    
    
    function compileController(environment, controller) {                
        var result = list(controller.behaviors).foldL(aTry.success("$:'"+ controller.name + "'"), function (result,behavior) {
            return result.flatmap(function(result) {
                return compileExpression(environment, list('self',controller.param.name), behavior.definition).map(function (expression) {
                    return result + ",'" + behavior.name + "':" + expression;                    
                });
            });
        });
        
        return result.map(function (result) {
            return "M.define('" + controller.name + "',function(mvc$" + controller.param.name + "){return M.controller(function(self){return {" + result + "});)};)";
        });
    }
    
    function compileView() {        
        return aTry.failure(new Error("NYI"));
    }
    
    return {
        model : compileModel,
        controller: compileController,        
        view: compileView,
        expression: compileExpression
    };

}());