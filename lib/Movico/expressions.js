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
    
    function getType(withModel, aType) {
        var result = aType;
        
        switch (reflect.typeof(aType)) {
            case 'Model':
                if (withModel) {
                    result = list(aType.params).foldR(function (param, result) {
                        return ast.type.abstraction(param.type, result);
                    }, aType);
                    
                    if (aType.generics.length > 0) {
                        result = ast.type.forall(aType.generics, result);
                    }
                }
                
                break;
            case 'Controller':
            case 'View':
                result = ast.type.abstraction(aType.param.type,aType); 
                if (aType.generics.length > 0) {
                    result = ast.type.forall(aType.generics, result);
                }
                break;
        }
        
        return result;
    }
    
    function getNative(substitutions, name) {
        var nativeType = types.substitute(substitutions, ast.type.variable(name));
        
        if (reflect.typeof(nativeType) === 'TypeVariable') {
            return ast.type.native(name);
        }
        
        return nativeType;
    }
        
    Expressions.prototype.native = function (substitutions, name) {
        return getNative(substitutions, name);
    };
    
    function unify(aType1, aType2) {
        return types.unify(aType1, aType2);
    }

    function analyseIdentExpression(nongenerics, environment, substitutions, expression) {
        return environment.findFirst(function (binding) {
            return binding._1 === expression.value;                      
        }).map(function (binding) {
            return aTry.success(pair(list(), types.substitute(substitutions, types.freshType(binding._2))));
        }).orElse(aTry.failure(new Error("Unbound variable " + expression.value)));        
    }

    function analyseInvokeExpression(nongenerics, environment, substitutions, expression) {
        return analyseExpression(nongenerics, environment, substitutions, expression.caller).flatmap(function (substitutionsAndEntity) {
            var entity = types.substitute(substitutions, substitutionsAndEntity._2),
                variablesAndType = types.reduce(entity);

            return variablesAndType.flatmap(function (variablesAndType) {
                switch (reflect.typeof(variablesAndType._2)) {
                    case 'Model':
                        return list(variablesAndType._2.params).findFirst(function (param) {
                            return param.name === expression.name;
                        }).map(function (param) {
                            return aTry.success(pair(substitutionsAndEntity._1, 
                                                     types.substitute(substitutions, types.substitute(variablesAndType._1,param.type))));
                        }).orElse(aTry.failure(new Error("Accessor " + expression.name + " not found in " + entity)));

                    case 'Controller':                            
                        return list(variablesAndType._2.specifications).findFirst(function (behavior) {
                            return behavior.name === expression.name;
                        }).map(function (behavior) {                        
                            return aTry.success(pair(substitutionsAndEntity._1, 
                                                     types.substitute(substitutions, types.substitute(variablesAndType._1,behavior.type))));
                        }).orElse(aTry.failure(new Error("Accessor not found")));                     

                    default: 
                        return aTry.failure(new Error(entity + " must be a model or a controller. Not a " + reflect.typeof(entity)));                            
                }
            });
        });        
    }
    
    function analysePairExpression(nongenerics, environment, substitutions, expression) {
        return analyseExpression(nongenerics, environment, substitutions, expression.left).flatmap(function (substitutionsAndLeft) {
            var newSubstitutions = types.substituteList(substitutionsAndLeft._1, substitutions);
            return analyseExpression(nongenerics, environment, newSubstitutions, expression.right).map(function (substitutionsAndRight) {
                var allSubstitutions = types.composeSubstitutions(substitutionsAndRight._1, substitutionsAndLeft._1);
                return pair(allSubstitutions, ast.type.pair(substitutionsAndLeft._2, substitutionsAndRight._2));
            });
        });        
    }
    
    function analyseApplicationExpression(nongenerics, environment, substitutions, expression) {
        return analyseExpression(nongenerics, environment, substitutions, expression.abstraction).flatmap(function (substitutionsAndAbstraction) {
            var newSubstitutions = types.substituteList(substitutionsAndAbstraction._1, substitutions);
            return analyseExpression(nongenerics, environment, newSubstitutions , expression.argument).flatmap(function (substitutionsAndArgument) {
                var newVariable = types.newVar(),
                    type1 = types.substitute(substitutions, 
                                             types.freshType(getType(false, types.substitute(substitutionsAndArgument._1, substitutionsAndAbstraction._2)))),
                    type2 = ast.type.abstraction(substitutionsAndArgument._2, newVariable);
                return unify(type1, type2).map(function (newSubstitutions) {
                    var allSubstitutions = types.composeSubstitutions(newSubstitutions, 
                                                                      types.composeSubstitutions(substitutionsAndArgument._1, 
                                                                                                 substitutionsAndAbstraction._1));
                    return pair(allSubstitutions.filter(function (binding) {
                        return binding._1 !== newVariable.name;
                    }), types.substitute(newSubstitutions, newVariable));
                });                        
            });                    
        });
    }
    
    function analyseComprehensionExpression(/*nongenerics, substitutions, expression*/) {
        return aTry.failure(new Error("ComprehensionExpr not yes implemented"));        
    }
    
    function analyseTagExpression(nongenerics, environment, substitutions, expression) {
        return list(expression.attributes).foldL(aTry.success(list()), function (newSubstitutions, attribute) {
            return newSubstitutions.flatmap(function (newSubstitutions) {
                return analyseExpression(nongenerics, environment, substitutions, attribute[1]).flatmap(function (substitutionsAndAttribute) {
                    return unify(types.substitute(newSubstitutions, substitutionsAndAttribute._2), getNative(substitutions, "string")).map(function (newSubstitutions) {
                        return types.composeSubstitutions(types.composeSubstitutions(newSubstitutions, substitutionsAndAttribute._1), substitutions);
                    });
                });
            });
        }).flatmap(function (newSubstitutions) {
            return list(expression.body).foldL(aTry.success(newSubstitutions), function (newSubstitutions, body) {
                return newSubstitutions.flatmap(function (newSubstitutions) {
                    return analyseExpression(nongenerics, environment, substitutions, body).flatmap(function (substitutionsAndBody) {
                        return unify(types.substitute(newSubstitutions, substitutionsAndBody._2), getNative(substitutions, "xml")).map(function (newSubstitutions) {
                            return types.composeSubstitutions(types.composeSubstitutions(newSubstitutions, substitutionsAndBody._1), substitutions);
                        });                           
                    });                            
                });
            }).map(function (newSubstitutions) {
                return pair(newSubstitutions, getNative(substitutions, "xml"));
            });
        });
    }
    
    function analyseLetExpression(nongenerics, environment, substitutions, expression) {
        return analyseExpression(nongenerics, environment, substitutions, expression.value).flatmap(function (substitutionsAndValue) {
            return types.generalize(nongenerics, substitutionsAndValue._2).flatmap(function (valueType) {                    
                var newEnvironment = list(pair(expression.name, types.substitute(substitutions, valueType))).append(environment);
                return analyseExpression(nongenerics, newEnvironment, substitutions, expression.body).map(function (substitutionsAndBody) {
                    return pair(types.composeSubstitutions(substitutionsAndBody._1, substitutionsAndValue._1), substitutionsAndBody._2);
                });
            });
        });        
    }
    
    function analyseAbstractionExpression(nongenerics, environment, substitutions, expression) {
        var varType = types.newVar();
        return analyseExpression(nongenerics, list(pair(expression.param, varType)).append(environment), substitutions, expression.body).map(function (substitutionsAndBody) {
            return pair(substitutionsAndBody._1, types.substitute(substitutionsAndBody._1, ast.type.abstraction(varType, substitutionsAndBody._2)));
        });
    }
    
    function analyseExpression(nongenerics, environment, substitutions, expression) {
        switch (reflect.typeof(expression)) {
            case 'NumberExpr':
                return aTry.success(pair(list(), getNative(substitutions, 'number')));
            case 'StringExpr':
                return aTry.success(pair(list(), getNative(substitutions, 'string')));            
            case 'IdentExpr':
                return analyseIdentExpression(nongenerics, environment, substitutions, expression);
            case 'InvokeExpr':
                return analyseInvokeExpression(nongenerics, environment, substitutions, expression);
            case 'PairExpr': 
                return analysePairExpression(nongenerics, environment, substitutions, expression);
            case 'ApplicationExpr':
                return analyseApplicationExpression(nongenerics, environment, substitutions, expression);
            case 'ComprehensionExpr':
                return analyseComprehensionExpression(nongenerics, environment, substitutions, expression);
            case 'TagExpr': 
                return analyseTagExpression(nongenerics, environment, substitutions, expression);
            case 'UnitExpr':
                return aTry.success(pair(list(), types.substitute(substitutions, getNative(substitutions, "unit"))));
            case 'LetExpr':
                return analyseLetExpression(nongenerics, environment, substitutions, expression);
            case 'AbstractionExpr':
                return analyseAbstractionExpression(nongenerics, environment, substitutions, expression);
            default:
                return aTry.failure(new Error(reflect.typeof(expression)));
        }
    }
    
    Expressions.prototype.analyse = function (nongenerics, environment, substitutions, expression) {
        return analyseExpression(nongenerics, environment, substitutions, expression).flatmap(function (substitutionsAndType) {
            return types.generalize(nongenerics, substitutionsAndType._2).map(function (generalized) {
                return pair(substitutionsAndType._1, generalized);
            });
        });
    };

    Expressions.prototype.typeOf = function (aType) {
        return getType(true, aType);
    };
    
    return new Expressions();
}());
    
    