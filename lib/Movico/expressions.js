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
    
    var reflect = require('../Data/reflect.js').reflect,
        list = require('../Data/list.js').list,
        pair = require('../Data/pair.js').pair,
        aTry = require('../Data/atry.js').atry,
        ast  = require('./ast.js').ast,
        types = require('./types.js').types;
    
    function Expressions() {
        // Nothing for the moment
    }
    
    function analyseExpression(nongenerics, variables, expression) {
        switch (reflect.typeof(expression)) {
            case 'NumberExpr':
                return aTry.success(pair(list(),ast.type.native('number')));

            case 'StringExpr':
                return aTry.success(pair(list(),ast.type.native('string')));
                
            case 'IdentExpr':
                return variables.findFirst(function (binding) {
                    return binding._1 === expression.value;                      
                }).map(function (binding) {
                    return aTry.success(pair(list(), binding._2));
                }).orElse(aTry.failure(new Error("Unbound variable " + expression.value)));
                
            case 'InstanceExpr':
                return analyseExpression(nongenerics, variables, ast.expr.ident(expression.name)).flatmap(function (variablesAndModel) {
                    var model = types.substitute(variablesAndModel._1, variablesAndModel._2);
                    
                    if (reflect.typeof(model) !== 'Model') {
                        return aTry.failure(new Error(expression.name + " is not a model"));
                    }
                    
                    if (expression.params.length !== model.params.length) {
                        return aTry.failure(new Error(expression.name + " requires " + model.params.length + " values"));
                    }                                    
                    
                    return list(expression.params).zipWith(list(model.params)).foldR(function (zip, result) {
                        if (result.isFailure()) {
                            return result;
                        }
                        
                        var substitutionsAndVariables = result.success();
                        
                        return analyseExpression(nongenerics, substitutionsAndVariables._2, zip._1).flatmap(function (variablesAndParam) {
                            return types.unify(variablesAndParam._2, zip._2.type).map(function (substitutions) {
                                return pair(types.composeSubstitutions(substitutions, 
                                                                       types.composeSubstitutions(variablesAndParam._1,
                                                                                                  substitutionsAndVariables._1)),
                                            types.substituteList(variablesAndParam._1, substitutionsAndVariables._2));
                            });
                        });                        
                    }, aTry.success(pair(variablesAndModel._1, variables))).map(function (substitutionsAndVariables) {
                        return pair(substitutionsAndVariables._1, variablesAndModel._2);                        
                    });                                            
                });    
                
            case 'InvokeExpr':
                return analyseExpression(nongenerics, variables, expression.caller).flatmap(function (variablesAndEntity) {
                    var entity = types.substitute(variablesAndEntity._1, variablesAndEntity._2);
                    
                    switch (reflect.typeof(entity)) {
                        case 'Model':
                            return list(entity.params).findFirst(function (param) {
                                return param.name === expression.name;
                            }).map(function (param) {
                                return pair(variablesAndEntity._1, types.substitute(variablesAndEntity._1, param.type));
                            });
                            
                        case 'Controller':                            
                            return list(entity.behaviors).findFirst(function (behavior) {
                                return behavior.name === expression.name;
                            }).flatmap(function (behavior) {
                                if (behavior.type) {
                                    return aTry.success(pair(variablesAndEntity._1, types.substitute(variablesAndEntity._1, behavior.type)));
                                }
                                
                                return aTry.failure(new Error("InvokeExpr")); 
                            });                     
                            
                        default: 
                            return aTry.failure(new Error(entity + " must be a model or a controller"));                            
                    }
                });
                
            case 'PairExpr':
                return analyseExpression(nongenerics, variables, expression.left).flatmap(function (variablesAndLeft) {
                    var newVariables = types.substituteList(variablesAndLeft._1, variables);
                    return analyseExpression(nongenerics, newVariables, expression.right).map(function (variablesAndRight) {
                        var allSubstitutions = types.composeSubstitutions(variablesAndRight._1, variablesAndLeft._1);
                        return pair(allSubstitutions, ast.type.pair(variablesAndLeft._2, variablesAndRight._2));
                    });
                });
                
            case 'ApplicationExpr':
                return analyseExpression(nongenerics, variables, expression.abstraction).flatmap(function (variablesAndAbstraction) {
                    var newVariables = types.substituteList(variablesAndAbstraction._1,variables);
                    return analyseExpression(nongenerics, newVariables, expression.argument).flatmap(function (variablesAndArgument) {
                        var newVariable = types.newVar(),
                            type1 = types.substitute(variablesAndArgument._1, variablesAndAbstraction._2),
                            type2 = ast.type.abstraction(variablesAndArgument._2, newVariable);
                        return types.unify(type1, type2).map(function (substitutions) {
                            var allSubstitutions = types.composeSubstitutions(substitutions, 
                                                                              types.composeSubstitutions(variablesAndArgument._1, 
                                                                                                         variablesAndAbstraction._1));
                            
                            return pair(allSubstitutions.filter(function (binding) {
                                return binding._1 !== newVariable.name;
                            }), types.substitute(substitutions, newVariable));
                        });                        
                    });                    
                });
                
            case 'ComprehensionExpr': // TODO
                return aTry.failure(new Error("ComprehensionExpr"));
                
            case 'TagExpr': // TODO
                return aTry.failure(new Error("TagExpr"));
                
            case 'UnitExpr':
                return aTry.success(pair(list(), ast.type.native("unit")));
                
            case 'LetExpr':
                return analyseExpression(nongenerics, variables, expression.value).flatmap(function (variablesAndValue) {
                    return types.generalize(nongenerics, variablesAndValue._2).flatmap(function (valueType) {                    
                        var newVariables = types.substituteList(variablesAndValue._1, list(pair(expression.name, valueType)).append(variables));
                        return analyseExpression(nongenerics, newVariables, expression.body).map(function (variablesAndBody) {
                            return pair(types.composeSubstitutions(variablesAndBody._1, variablesAndValue._1), variablesAndBody._2);
                        });
                    });
                });
                
            case 'AbstractionExpr':
                return analyseExpression(nongenerics, list(pair(expression.param.name, expression.param.type)).append(variables), expression.body).map(function (variablesAndBody) {
                    return pair(variablesAndBody._1, ast.type.abstraction(expression.param.type, variablesAndBody._2));
                });
                
            case 'PolymorphicExpr':
                return analyseExpression(list(expression.variable).append(nongenerics), variables, expression.body).map(function (variablesAndBody) {
                    return pair(variablesAndBody._1, ast.type.forall(expression.variable, variablesAndBody._2));
                });
                                          
            default:
                return aTry.failure(new Error(reflect.typeof(expression)));
        }
    }
    
    Expressions.prototype.analyse = function (nongenerics, variables, expression) {
        return analyseExpression(nongenerics, variables, expression).flatmap(function (variablesAndType) {
            return types.generalize(nongenerics, variablesAndType._2).map(function () {
                return variablesAndType;
            });
        });
    };
    
    Expressions.prototype.typecheck = function (variables, expression) {
        return this.analyse(list(), variables, expression).map(function (variablesAndTypes) {
            return types.substitute(variablesAndTypes._1, variablesAndTypes._2); 
        });
    };
    
    return new Expressions();
}());
    
    