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
        option = require('../Data/option.js').option,
        aTry = require('../Data/atry.js').atry,
        ast  = require('./ast.js').ast,
        types = require('./types.js').types;
    
    function Expressions() {
        // Nothing for the moment
    }
        
    function getNative(substitutions, name) {
        var nativeType = substitute(substitutions, ast.type.variable(name));
        
        if (reflect.typeof(nativeType) === 'TypeVariable') {
            return ast.type.native(name);
        }
        
        return nativeType;
    }
        
    Expressions.prototype.native = function (substitutions, name) {
        return getNative(substitutions, name);
    };
    
    function builder(aType) {
        return types.builder(aType);
    }
    
    function substitute(substitutions, aType) {
        return types.substitute(substitutions, aType);
    }
    
    function unify(aType1, aType2) {
        return types.unify(aType1, aType2).map(function (result) {
            return aTry.success(result);
        }).recoverWith(aTry.failure(new Error("Cannot unify " + aType1 + " and " + aType2)));
    }

    function analyseIdentExpression(nongenerics, environment, substitutions, expression, type) {
        return environment.findFirst(function (binding) {
            return binding._1 === expression.value;                      
        }).map(function (binding) {
            var providedType = substitute(substitutions, binding._2);
            
            return unify(providedType, type).map(function (newSubstitutions) {
                return function () { 
                    return aTry.success(pair(newSubstitutions, substitute(newSubstitutions, type)));
                };
            }).recoverWith(function() {
                return builder(providedType).flatmap(function (builder) {
                    return unify(substitute(substitutions, builder), type).map(function (newSubstitutions) {
                        return aTry.success(pair(newSubstitutions, substitute(newSubstitutions, type)));
                    });
                }).recoverWith(aTry.failure(new Error("Cannot unify " + providedType + " and " + type)));
            })();
        }).orElse(aTry.failure(new Error("Unbound variable " + expression.value)));        
    }

    function retrieveCallerType(entity, name) {
        return types.reduce(entity).flatmap(function (entity) {
            switch (reflect.typeof(entity)) {
                case 'Model':
                    return list(entity.params).findFirst(function (param) {
                        return param.name === name;
                    }).map(function (param) {
                        return aTry.success(param.type);
                    }).orElse(aTry.failure(new Error("Accessor '" + name + "' not found in " + entity)));

                case 'Controller':                            
                    return list(entity.specifications).findFirst(function (behavior) {
                        return behavior.name === name;
                    }).map(function (behavior) {                        
                        return aTry.success(behavior.type);
                    }).orElse(aTry.failure(new Error("Accessor '" + name + "' not found in " + entity)));                     

                default: 
                    return aTry.failure(new Error(entity + " must be a model or a controller. Not a " + reflect.typeof(entity)));                            
            }        
        });
    }
    
    function analyseInvokeExpression(nongenerics, environment, substitutions, expression, type) {
        return analyseExpression(nongenerics, environment, substitutions, expression.caller, types.newVar()).flatmap(function (substitutionsAndEntity) {
            return retrieveCallerType(substitute(substitutions, substitutionsAndEntity._2), expression.name).flatmap(function (methodType) {
                return unify(substitute(substitutionsAndEntity._1, substitute(substitutions, methodType)), substitute(substitutionsAndEntity._1, type)).map(function (newSubstitutions) {
                    return pair(types.composeSubstitutions(newSubstitutions, substitutionsAndEntity._1), 
                                substitute(substitutionsAndEntity._1,substitute(newSubstitutions, type)));
                });
            });
        });  
    }
    
    function analysePairExpression(nongenerics, environment, substitutions, expression, type) {
        
        // (a,b) === Pair a b
        
        var newExpression = ast.expr.application(ast.expr.application(ast.expr.ident("Pair"), expression.left),expression.right);
        return analyseExpression(nongenerics, environment, substitutions, newExpression, type);    
    }
    
    function analyseApplicationExpression(nongenerics, environment, substitutions, expression, type) {
        var varArgument = types.newVar();
        
        return analyseExpression(nongenerics, environment, substitutions, expression.abstraction, ast.type.abstraction(varArgument, type)).flatmap(function (substitutionsAndAbstraction) {
            return analyseExpression(nongenerics, environment, substitutions , expression.argument, substitute(substitutionsAndAbstraction._1, varArgument)).map(function (substitutionsAndArgument) {                
                var newSubstitutions = types.composeSubstitutions(substitutionsAndArgument._1, substitutionsAndAbstraction._1);
                return pair(newSubstitutions, substitute(substitutionsAndAbstraction._1, substitute(substitutionsAndArgument._1, type)));
            });                    
        });
    }
    
    function analyseComprehensionExpression(nongenerics, environment, substitutions, expression, type) {
        var iteration = expression.iterations[0],
            iterations = expression.iterations.splice(1),
            newExpression;
        
        // [ p for a in La for b in La if C1] === Lb.flatmap(fun b -> La.filter(a -> C1).map(a -> p))
        
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
        
        return analyseExpression(nongenerics, environment, substitutions, newExpression, type);
    }
    
    function analyseTagExpression(nongenerics, environment, substitutions, expression, type) {
        return list(expression.attributes).foldL(aTry.success(list()), function (newSubstitutions, attribute) {
            return newSubstitutions.flatmap(function (newSubstitutions) {
                return analyseExpression(nongenerics, environment, substitutions, attribute[1], getNative(substitutions, "string")).map(function (substitutionsAndAttribute) {
                    return types.composeSubstitutions(types.composeSubstitutions(substitutionsAndAttribute._1, newSubstitutions), substitutions);
                });
            });
        }).flatmap(function (newSubstitutions) {
            return list(expression.body).foldL(aTry.success(newSubstitutions), function (newSubstitutions, body) {
                return newSubstitutions.flatmap(function (newSubstitutions) {
                    return analyseExpression(nongenerics, environment, substitutions, body, type).map(function (substitutionsAndBody) {
                        return types.composeSubstitutions(types.composeSubstitutions(newSubstitutions, substitutionsAndBody._1), substitutions);
                    });                            
                });
            }).map(function (newSubstitutions) {
                return pair(newSubstitutions, type);
            });
        });
    }
    
    function analyseLetExpression(nongenerics, environment, substitutions, expression, type) {
        return analyseExpression(nongenerics, environment, substitutions, expression.value, types.newVar()).flatmap(function (substitutionsAndValue) {
            var newEnvironment = list(pair(expression.name, substitute(substitutions, substitutionsAndValue._2))).append(environment);
            return analyseExpression(nongenerics, newEnvironment, substitutions, expression.body, type).map(function (substitutionsAndBody) {
                var allSubstitutions = substitute(substitutionsAndValue._1, substitutionsAndBody._1);
                return pair(allSubstitutions, substitutionsAndBody._2);
            });
        });        
    }
    
    function analyseAbstractionExpression(nongenerics, environment, substitutions, expression, type) {
        var varArgument = types.newVar(), varResult = types.newVar();
        
        return types.unify(ast.type.abstraction(varArgument, varResult), type).flatmap(function (newSubstitutions) {            
            var newEnvironment = list(pair(expression.param, substitute(newSubstitutions, varArgument))).append(environment);
            
            return analyseExpression(nongenerics, newEnvironment, substitutions, expression.body, substitute(newSubstitutions, varResult)).map(function (substitutionsAndBody) {
                var allSubstitutions = types.composeSubstitutions(substitutionsAndBody._1, newSubstitutions);
                return pair(allSubstitutions, substitute(substitutionsAndBody._1, substitute(newSubstitutions, type)));
            });
        });
    }
    
    function analyseExpression(nongenerics, environment, substitutions, expression, type) {
        var result;
        
        switch (reflect.typeof(expression)) {
            case 'NumberExpr':            
                result = unify(getNative(substitutions, 'number'), type).map(function (newSubstitutions) {
                    return pair(newSubstitutions, getNative(substitutions, 'number'));
                });
                break;
            case 'StringExpr':
                result = unify(getNative(substitutions, 'string'), type).map(function (newSubstitutions) {
                    return pair(newSubstitutions, getNative(substitutions, 'string'));
                });
                break;
            case 'UnitExpr':
                result = unify(getNative(substitutions, 'unit'), type).map(function (newSubstitutions) {
                    return pair(newSubstitutions, getNative(substitutions, 'unit'));
                });
                break;
            case 'IdentExpr':
                result = analyseIdentExpression(nongenerics, environment, substitutions, expression, type);
                break;
            case 'InvokeExpr':
                result = analyseInvokeExpression(nongenerics, environment, substitutions, expression, type);
                break;
            case 'PairExpr': 
                result = analysePairExpression(nongenerics, environment, substitutions, expression, type);
                break;
            case 'ApplicationExpr':
                result = analyseApplicationExpression(nongenerics, environment, substitutions, expression, type);
                break;
            case 'ComprehensionExpr':
                result = analyseComprehensionExpression(nongenerics, environment, substitutions, expression, type);
                break;
            case 'TagExpr': 
                // TODO
                result = unify(getNative(substitutions, "xml"), type).flatmap(function (newSubstitutions) {
                    return analyseTagExpression(nongenerics, environment, substitutions, expression, getNative(substitutions, "xml")).map(function () {
                        return pair(newSubstitutions, getNative(substitutions, 'xml'));
                    });
                });
                break;
            case 'LetExpr':
                result = analyseLetExpression(nongenerics, environment, substitutions, expression, type);
                break;
            case 'AbstractionExpr':
                result = analyseAbstractionExpression(nongenerics, environment, substitutions, expression, type);
                break;
            default:
                result = aTry.failure(new Error(reflect.typeof(expression)));
        }

        return result;
    }
    
    Expressions.prototype.analyse = function (nongenerics, environment, substitutions, expression, type) {
        return analyseExpression(nongenerics, environment, substitutions, expression, option.some(type).orElse(types.newVar()));
    };
    
    return new Expressions();
}());
    
    