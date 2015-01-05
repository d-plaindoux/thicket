/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
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
    
    function analyseIdentExpression(nongenerics, variables, expression) {
        return variables.findFirst(function (binding) {
            return binding._1 === expression.value;                      
        }).map(function (binding) {
            return aTry.success(pair(list(), binding._2));
        }).orElse(aTry.failure(new Error("Unbound variable " + expression.value)));        
    }
 
    function analyseInvokeExpression(nongenerics, variables, expression) {
        return analyseExpression(nongenerics, variables, expression.caller).flatmap(function (variablesAndEntity) {
            var entity = types.substitute(variables, variablesAndEntity._2);

            switch (reflect.typeof(entity)) {
                case 'Model':
                    return list(entity.params).findFirst(function (param) {
                        return param.name === expression.name;
                    }).map(function (param) {
                        return aTry.success(pair(variablesAndEntity._1, types.substitute(variablesAndEntity._1, param.type)));
                    }).orElse(aTry.failure(new Error("Accessor not found")));

                case 'Controller':                            
                    return list(entity.specifications).findFirst(function (behavior) {
                        return behavior.name === expression.name;
                    }).map(function (behavior) {                        
                        return aTry.success(pair(variablesAndEntity._1, types.substitute(variablesAndEntity._1, behavior.type)));
                    }).orElse(aTry.failure(new Error("Accessor not found")));                     

                default: 
                    return aTry.failure(new Error(entity + " must be a model or a controller. Not a " + reflect.typeof(entity)));                            
            }
        });        
    }
    
    function analysePairExpression(nongenerics, variables, expression) {
        return analyseExpression(nongenerics, variables, expression.left).flatmap(function (variablesAndLeft) {
            var newVariables = types.substituteList(variablesAndLeft._1, variables);
            return analyseExpression(nongenerics, newVariables, expression.right).map(function (variablesAndRight) {
                var allSubstitutions = types.composeSubstitutions(variablesAndRight._1, variablesAndLeft._1);
                return pair(allSubstitutions, ast.type.pair(variablesAndLeft._2, variablesAndRight._2));
            });
        });        
    }
    
    function analyseApplicationExpression(nongenerics, variables, expression) {
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
    }
    
    function analyseComprehensionExpression(/*nongenerics, variables, expression*/) {
        return aTry.failure(new Error("ComprehensionExpr not yes implemented"));        
    }
    
    function analyseTagExpression(nongenerics, variables, expression) {
        return list(expression.attributes).foldL(aTry.success(list()), function (substitutions, attribute) {
            return substitutions.flatmap(function (substitutions) {
                return analyseExpression(nongenerics, variables, attribute[1]).flatmap(function (variablesAndAttribute) {
                    return types.unify(types.substitute(substitutions, variablesAndAttribute._2), ast.type.native("string")).map(function (newSubstitutions) {
                        return types.composeSubstitutions(types.composeSubstitutions(newSubstitutions, variablesAndAttribute._1), substitutions);
                    });
                });
            });
        }).flatmap(function (substitutions) {
            return list(expression.body).foldL(aTry.success(substitutions), function (substitutions, body) {
                return substitutions.flatmap(function (substitutions) {
                    return analyseExpression(nongenerics, variables, body).flatmap(function (variablesAndBody) {
                        return types.unify(types.substitute(substitutions, variablesAndBody._2), ast.type.native("xml")).map(function (newSubstitutions) {
                            return types.composeSubstitutions(types.composeSubstitutions(newSubstitutions, variablesAndBody._1), substitutions);
                        });                           
                    });                            
                });
            }).map(function (substitutions) {
                return pair(substitutions, ast.type.native("xml"));
            });
        });
    }
    
    function analyseLetExpression(nongenerics, variables, expression) {
        return analyseExpression(nongenerics, variables, expression.value).flatmap(function (variablesAndValue) {
            return types.generalize(nongenerics, variablesAndValue._2).flatmap(function (valueType) {                    
                var newVariables = types.substituteList(variablesAndValue._1, list(pair(expression.name, valueType)).append(variables));
                return analyseExpression(nongenerics, newVariables, expression.body).map(function (variablesAndBody) {
                    return pair(types.composeSubstitutions(variablesAndBody._1, variablesAndValue._1), variablesAndBody._2);
                });
            });
        });        
    }
    
    function analyseAbstractionExpression(nongenerics, variables, expression) {
        var varType = types.newVar();
        return analyseExpression(nongenerics, list(pair(expression.param, varType)).append(variables), expression.body).map(function (variablesAndBody) {
            return pair(variablesAndBody._1, types.substitute(variablesAndBody._1, ast.type.abstraction(varType, variablesAndBody._2)));
        });
    }
    
    function analyseExpression(nongenerics, variables, expression) {
        switch (reflect.typeof(expression)) {
            case 'NumberExpr':
                return aTry.success(pair(list(),ast.type.native('number')));
            case 'StringExpr':
                return aTry.success(pair(list(),ast.type.native('string')));            
            case 'IdentExpr':
                return analyseIdentExpression(nongenerics, variables, expression);
            case 'InvokeExpr':
                return analyseInvokeExpression(nongenerics, variables, expression);
            case 'PairExpr': 
                return analysePairExpression(nongenerics, variables, expression);
            case 'ApplicationExpr':
                return analyseApplicationExpression(nongenerics, variables, expression);
            case 'ComprehensionExpr':
                return analyseComprehensionExpression(nongenerics, variables, expression);
            case 'TagExpr': 
                return analyseTagExpression(nongenerics, variables, expression);
            case 'UnitExpr':
                return aTry.success(pair(list(), ast.type.native("unit")));
            case 'LetExpr':
                return analyseLetExpression(nongenerics, variables, expression);
            case 'AbstractionExpr':
                return analyseAbstractionExpression(nongenerics, variables, expression);
            default:
                return aTry.failure(new Error(reflect.typeof(expression)));
        }
    }
    
    Expressions.prototype.analyse = function (nongenerics, variables, expression) {
        return analyseExpression(nongenerics, variables, expression).flatmap(function (variablesAndType) {
            return types.generalize(nongenerics, variablesAndType._2).map(function (generalized) {
                return pair(variablesAndType._1, generalized);
            });
        });
    };
    
    return new Expressions();
}());
    
    