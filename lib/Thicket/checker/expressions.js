/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

/*
 * Definitively javascrit is too verbose in 
 * particular when dealing with lambda terms!
 */

module.exports = (function () {
    
    'use strict';
    
    var error = require('../exception.js'),
        list = require('../../Data/list.js'),
        pair = require('../../Data/pair.js'),
        option = require('../../Data/option.js'),
        aTry = require('../../Data/atry.js'),
        ast  = require('../syntax/ast.js'),
        types = require('../checker/types.js'),
        stringify = require('../syntax/stringify.js');
    
    function Expressions() {
        // Nothing for the moment
    }
        
    function getNative(specifications, name) {
        var resultType = ast.type.variable(name);
        
        return types.unfold(specifications,resultType).map(function (nativeType) {
            if (nativeType.$type === 'TypeVariable') {
                return ast.type.native(name);
            }
            return nativeType;
        }).recoverWith(resultType);        
    }
        
    Expressions.prototype.native = function (specifications, name) {
        return getNative(specifications, name);
    };
    
    function substitute(substitutions, aType) {
        return types.substitute(substitutions, aType);
    }
    
    function unify(aType1, aType2) {
        return types.unify(aType1, aType2).map(function (result) {
            return aTry.success(result);
        }).lazyRecoverWith(function () {
            return aTry.failure(new Error("Cannot unify " + stringify(aType1) + " and " + stringify(aType2)));
        });
    }

    /*
     * Identifier
     */
    function analyseIdentExpression(nongenerics, environment, specifications, substitutions, expression, type) {
        return environment.findFirst(function (binding) {
            return binding._1 === expression.value;                      
        }).map(function (binding) {
            if (!binding._2) {
                return aTry.failure(error(expression, "Undefined type for definition " + binding._1));
            }

            return types.unfold(specifications, substitute(substitutions, binding._2)).flatmap(function (unfoldType) {
                var providedType = types.instantiate(unfoldType);

                return unify(providedType, type).map(function (newSubstitutions) {
                    return function () { 
                        return aTry.success(pair(newSubstitutions, substitute(newSubstitutions, type)));
                    };
                }).recoverWith(function() {
                    // May be it's self or this and then we can call the contructor instead
                    return aTry.failure(error(expression, "Cannot unify " + stringify(providedType) + " and " + stringify(type)));
                })();
            });
        }).orElse(aTry.failure(error(expression, "Unbound variable " + expression.value)));        
    }
    
    function retrieveModelType(specifications, entity, name) {
        return types.unfold(specifications, entity).flatmap(function (unfoldType) {
            return types.reduce(unfoldType).flatmap(function (definition) {
                var entity = types.instantiate(definition);

                switch (entity.$type) {
                    case 'Typedef':
                        return types.unfold(specifications, entity.type).flatmap(function (unfoldType) {
                            return retrieveModelType(unfoldType, name);
                        });

                    case 'Model':
                        return list(entity.params).findFirst(function (param) {
                            return param.name === name;
                        }).map(function (param) {
                            return types.unfold(specifications, param.type).map(function (unfoldType) {
                                return types.instantiate(unfoldType);
                            });
                        }).orElse(aTry.failure(error(entity, "definition '" + name + "' not found in " + stringify(entity))));

                    case 'Controller':                            
                        return aTry.failure(error(entity, stringify(entity) + " is not a model"));                            

                    default: 
                        return aTry.failure(error(entity, "definition " + name + " not found for " + stringify(entity)));                            
                }        
            });
        });
    }

    function retrieveCallerType(specifications, entity, name) {
        return types.unfold(specifications, entity).flatmap(function (unfoldType) {
            return types.reduce(unfoldType).flatmap(function (definition) {
                var entity = types.instantiate(definition);

                switch (entity.$type) {
                    case 'Typedef':
                        return types.unfold(specifications, entity.type).flatmap(function (unfoldType) {
                            return retrieveCallerType(unfoldType, name);
                        });

                    case 'Model':
                        return list(entity.params).findFirst(function (param) {
                            return param.name === name;
                        }).map(function (param) {
                            return types.unfold(specifications, param.type).map(function (unfoldType) {
                                return types.instantiate(unfoldType);
                            });
                        }).orElse(aTry.failure(error(entity, "definition '" + name + "' not found in " + stringify(entity))));

                    case 'Controller':                            
                        return list(entity.specifications).findFirst(function (behavior) {
                            return behavior.name === name;
                        }).map(function (behavior) {
                            return types.unfold(specifications, behavior.type).map(function (unfoldType) {
                                return types.instantiate(unfoldType);
                            });
                        }).orElse(aTry.failure(error(entity, "definition '" + name + "' not found in " + stringify(entity))));                     

                    default: 
                        return aTry.failure(error(entity, "definition " + name + " not found for " + stringify(entity)));                            
                }        
            });
        });
    }

    /* 
     * Invocation
     */
    function analyseInvokeExpression(nongenerics, environment, specifications, substitutions, expression, type) {
        return analyseExpression(nongenerics, environment, specifications, substitutions, expression.caller, types.newVar()).flatmap(function (substitutionsAndEntity) {
            return retrieveCallerType(specifications, ast.relocate(substitute(substitutions, substitutionsAndEntity._2), expression), expression.name).flatmap(function (methodType) {
                return unify(substitute(substitutionsAndEntity._1, substitute(substitutions, methodType)), substitute(substitutionsAndEntity._1, type)).map(function (newSubstitutions) {
                    return pair(types.composeSubstitutions(newSubstitutions, substitutionsAndEntity._1), 
                                substitute(substitutionsAndEntity._1,substitute(newSubstitutions, type)));
                });
            });
        });  
    }
    
    /* 
     * Pair
     */    
    function analysePairExpression(nongenerics, environment, specifications, substitutions, expression, type) {
        
        // (a,b) === Pair a b
        
        var newExpression = ast.relocate(ast.expr.application(ast.expr.application(ast.expr.ident("Pair"), expression.left),expression.right), expression);
        return analyseExpression(nongenerics, environment, specifications, substitutions, newExpression, type);    
    }
    
    /* 
     * Application
     */
    function analyseApplicationExpression(nongenerics, environment, specifications, substitutions, expression, type) {
        var varArgument = types.newVar(),
            result1 = analyseExpression(nongenerics, environment, specifications, substitutions, expression.abstraction, ast.type.abstraction(varArgument, type)).flatmap(function (substitutionsAndAbstraction) {                
                return types.unfold(specifications, substitute(substitutionsAndAbstraction._1, varArgument)).flatmap(function (unfoldType) {
                    var newVarArgument = types.neutralize(unfoldType);
                    return analyseExpression(nongenerics, environment, specifications, types.composeSubstitutions(substitutions, substitutionsAndAbstraction._1), expression.argument, newVarArgument).map(function (substitutionsAndArgument) {
                        var newSubstitutions = types.composeSubstitutions(substitutionsAndArgument._1, substitutionsAndAbstraction._1);
                        return pair(newSubstitutions, substitute(substitutionsAndAbstraction._1, substitute(substitutionsAndArgument._1, type)));
                    });                    
                });
            });
        
        if (result1.isSuccess()) {
            return result1;
        }

        // Invoke requires reverse type checking tactic so lets try it now !

        return analyseExpression(nongenerics, environment, specifications, substitutions, expression.argument, varArgument).flatmap(function (substitutionsAndArgument) {
            return types.unfold(specifications, substitute(substitutionsAndArgument._1, varArgument)).flatmap(function (unfoldType) {
                var newVarArgument = types.neutralize(unfoldType);

                return analyseExpression(nongenerics, environment, specifications, types.composeSubstitutions(substitutions, substitutionsAndArgument._1), expression.abstraction, ast.type.abstraction(newVarArgument, type)).map(function (substitutionsAndAbstraction) {                
                    var newSubstitutions = types.composeSubstitutions(substitutionsAndAbstraction._1, substitutionsAndArgument._1);
                    return pair(newSubstitutions, substitute(substitutionsAndArgument._1, substitute(substitutionsAndAbstraction._1, type)));
                });                    
            });
        });
    }
    
    /* 
     * Comprehension
     */
    function analyseComprehensionExpression(nongenerics, environment, specifications, substitutions, expression, type) {
        var riterations = expression.iterations.reverse(), 
            iteration = riterations[0],
            iterations = riterations.slice(1),
            newExpression;
        
        // for a <- La b <- Lb if C1 yield p === La flatmap (a -> Lb filter (b -> C1) map (b -> p))
        
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
        
        return analyseApplicationExpression(nongenerics, environment, specifications, substitutions, newExpression, type);
    }
    
    /* 
     * Tag
     */
    function analyseTagExpression(nongenerics, environment, specifications, substitutions, expression, type) {
        return list(expression.attributes).foldL(aTry.success(list()), function (newSubstitutions, attribute) {
            return newSubstitutions.flatmap(function (newSubstitutions) {
                var stringType = ast.relocate(getNative(specifications, "string"), expression);
                return analyseExpression(nongenerics, environment, specifications, substitutions, attribute[1], stringType).map(function (substitutionsAndAttribute) {
                    return types.composeSubstitutions(types.composeSubstitutions(substitutionsAndAttribute._1, newSubstitutions), substitutions);
                });
            });
        }).flatmap(function (newSubstitutions) {
            return list(expression.body).foldL(aTry.success(newSubstitutions), function (newSubstitutions, body) {
                return newSubstitutions.flatmap(function (newSubstitutions) {
                    return analyseExpression(nongenerics, environment, specifications, substitutions, body, type).map(function (substitutionsAndBody) {
                        return types.composeSubstitutions(types.composeSubstitutions(newSubstitutions, substitutionsAndBody._1), substitutions);
                    });                            
                });
            }).map(function (newSubstitutions) {
                return pair(newSubstitutions, type);
            });
        });
    }

    /* 
     * Let
     */
    function analyseLetExpression(nongenerics, environment, specifications, substitutions, expression, type) {
        // Must be done using LET type checking rule for generalization purpose
        var newExpression = ast.expr.application(ast.expr.abstraction(expression.name, 
                                                                      expression.body,
                                                                      expression.type),
                                                 expression.value);
        
        return analyseApplicationExpression(nongenerics, environment, specifications, substitutions, ast.relocate(newExpression, expression), type);
    }

    /* 
     * Function
     */
    function analyseAbstractionExpression(nongenerics, environment, specifications, substitutions, expression, type) {
        var varArgument = substitute(substitutions, option.some(expression.type).orLazyElse(function () { return types.newVar(); })), 
            varResult = types.newVar();
        
        return types.unfold(specifications, varArgument).flatmap(function (varArgument) {
            if (expression.type) {
                // Check unbound type variable
                var freeVariables = types.freeVariables(varArgument).
                                            minus(specifications.map(function (specification) { return specification._1; })).
                                            minus(substitutions.map(function (substitution) { return substitution._1; }));

                if (!freeVariables.isEmpty()) {
                    return aTry.failure(error(expression, "free variables: " + freeVariables.value.join(" ")));
                }
            } 

            return unify(ast.type.abstraction(varArgument, varResult), type).flatmap(function (newSubstitutions) {            
                var newEnvironment = list(pair(expression.param, substitute(newSubstitutions, varArgument))).append(environment);

                return types.unfold(specifications, substitute(substitutions, substitute(newSubstitutions, varResult))).flatmap(function (newVarResult) {            
                    return analyseExpression(nongenerics, newEnvironment, specifications, substitutions.append(newSubstitutions), expression.body, newVarResult).map(function (substitutionsAndBody) {
                        var allSubstitutions = types.composeSubstitutions(substitutionsAndBody._1, newSubstitutions);
                        return pair(allSubstitutions, substitute(substitutionsAndBody._1, substitute(newSubstitutions, type)));
                    });
                });
            });
        });
    }

    function analyseNative(nativeType, type) {
        return unify(nativeType, type).map(function (newSubstitutions) {
            return pair(newSubstitutions, nativeType);
        });
    }
    
    function analyseNewModelAttribute(nongenerics, environment, specifications, substitutions, expression, type, name) {            
        return retrieveModelType(specifications, type, name).flatmap(function(attributeType) {
            return analyseExpression(nongenerics, environment, specifications, substitutions, expression, attributeType);
        });
    }
    
    function analyseNewModel(nongenerics, environment, specifications, substitutions, expression, type) {
        var newSubstitutionsAndType = analyseExpression(nongenerics, environment, specifications, substitutions, expression.model, type);
        
        return list(expression.alter).foldL(newSubstitutionsAndType, function(newSubstitutionsAndType, alter) {
            return newSubstitutionsAndType.flatmap(function(newSubstitutionsAndType) {
                return analyseNewModelAttribute(nongenerics, environment, specifications, substitutions, alter[1], newSubstitutionsAndType._2, alter[0]).map(function(substitutionsAndAlter) {
                    var allSubstitutions = types.composeSubstitutions(substitutionsAndAlter._1, newSubstitutionsAndType._1);
                    return pair(allSubstitutions, substitute(substitutionsAndAlter._1, newSubstitutionsAndType._2));
                });
            });                                              
        });
    }
    
    /* 
     * Expression - main function
     */
    function analyseExpression(nongenerics, environment, specifications, substitutions, expression, type) {
        var result;
        
        switch (expression.$type) {
            case 'NumberExpr':  
                result = analyseNative(getNative(specifications, 'number'), type);
                break;
            case 'StringExpr':
                result = analyseNative(getNative(specifications, 'string'), type);
                break;
            case 'UnitExpr':
                result = analyseNative(getNative(specifications, 'unit'), type);
                break;
            case 'IdentExpr':
                result = analyseIdentExpression(nongenerics, environment, specifications, substitutions, expression, type);
                break;
            case 'InvokeExpr':
                result = analyseInvokeExpression(nongenerics, environment, specifications, substitutions, expression, type);
                break;
            case 'PairExpr': 
                result = analysePairExpression(nongenerics, environment, specifications, substitutions, expression, type);
                break;
            case 'ApplicationExpr':
                if (expression.argument.$type === 'IdentExpr' && 
                    !environment.findFirst(function (binding) { return binding._1 === expression.argument.value;}).isPresent()) {  
                    var newExpression = ast.expr.invoke(expression.abstraction, expression.argument.value);                
                    result = analyseExpression(nongenerics, environment, specifications, substitutions, ast.relocate(newExpression, expression.abstraction), type);
                } else {
                    result = analyseApplicationExpression(nongenerics, environment, specifications, substitutions, expression, type);
                }                                
                break;
            case 'ComprehensionExpr':
                result = analyseComprehensionExpression(nongenerics, environment, specifications, substitutions, expression, type);
                break;
            case 'TagExpr': 
                var elementType = getNative(specifications, 'dom');
                result = analyseNative(elementType, type).flatmap(function (newSubstitutionsAndType) {
                    return analyseTagExpression(nongenerics, environment, specifications, substitutions, expression, elementType).map(function () {
                        return newSubstitutionsAndType;
                    });
                });
                break;
            case 'LetExpr':
                result = analyseLetExpression(nongenerics, environment, specifications, substitutions, expression, type);
                break;
            case 'AbstractionExpr':
                result = analyseAbstractionExpression(nongenerics, environment, specifications, substitutions, expression, type);
                break;
            case 'NewModelExpr':
                result = analyseNewModel(nongenerics, environment, specifications, substitutions, expression, type);
                break;
            default:
                result = aTry.failure(error(expression, "Cannot typecheck an " + expression.$type));
        }
        
        return result;
    }
    
    Expressions.prototype.analyse = function (nongenerics, environment, specifications, expression, type) {
        return types.unfold(specifications, option.some(type).orElse(types.newVar())).flatmap(function (type) {
            return analyseExpression(nongenerics, environment, specifications, list(), expression, type);
        });
    };
    
    return new Expressions();
}());
    
    