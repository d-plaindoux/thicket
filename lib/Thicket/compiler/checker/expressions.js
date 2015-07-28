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
        list = require('../../../Data/list.js'),
        pair = require('../../../Data/pair.js'),
        option = require('../../../Data/option.js'),
        aTry = require('../../../Data/atry.js'),
        ast  = require('../syntax/ast.js'),
        types = require('../checker/types.js'),
        stringify = require('../syntax/stringify.js');
    
    function Expressions() {
        // Nothing for the moment
    }
        
    function getCoreType(environment, name) {
        var namespace = getTypeNamespace(environment, name);
        
        if (namespace) {
            return environment.getType(namespace, name).recoverWith(ast.type.native(name));        
        }
        
        return ast.type.native(name);
    }
    
    function getTypeNamespace(environment, name) {
        return environment.findTypeNamespace(name).recoverWith(null);
    }
    
    function getExpressionNamespace(environment, name) {
        return environment.findExpressionNamespace(name).recoverWith(null);
    }
    
    function substitute(substitutions, aType) {
        return types.substitute(substitutions, aType);
    }
    
    function unify(inferredType, expectedType) {
        return types.unify(inferredType, expectedType).map(function (result) {
            return aTry.success(result);
        }).lazyRecoverWith(function () {
            return aTry.failure(
                error(expectedType, 
                      "Cannot unify " + stringify(inferredType) + " and " + stringify(expectedType))
            );
        });
    }

    /*
     * Adapter 
     */    
    function unifyOrAdapt(environment, expression, providedType, type) {
        var adaptedType = ast.type.abstraction(providedType, type);
        
        return environment.adapters().foldL(unify(providedType, type), function(unification, entity) {
            
            if (unification.isSuccess()) {
                return unification;
            }
            
            return types.unfold(list(), environment, entity.definition).flatmap(function (unfoldType) {
                return types.reduce(unfoldType).map(function (definition) {
                    return types.instantiate(definition);
                });
            }).flatmap(function(adapter) {
               return unify(adaptedType, adapter).map(function(newSubstitutions) {
                   ast.adapted(expression, entity.name);
                   return newSubstitutions;
               });
            });
        });    
    }
    
    /*
     * Identifier
     */
    function analyseIdentExpression(bindings, environment, substitutions, expression, type) {
        var binding;
        
        if (expression.namespace) {
            binding = environment.getExpression(expression.namespace, expression.value);
        } else {
            binding = bindings.findFirst(function (binding) {
                return binding._1 === expression.value;                      
            }).map(function(binding) {
                return aTry.success(binding._2);
            }).orLazyElse(function() {
                return aTry.failure(error(expression, "Unbound variable " + expression.value));
            });
        }
        
        return binding.flatmap(function (binding) {
            return types.unfold(list(), environment, substitute(substitutions, binding)).flatmap(function (unfoldType) {
                var providedType = types.instantiate(unfoldType);

                return unifyOrAdapt(environment, expression, providedType, type).map(function (newSubstitutions) {
                    return aTry.success(pair(newSubstitutions, substitute(newSubstitutions, type)));
                }).lazyRecoverWith(function() {
                    return aTry.failure(error(expression, "Cannot unify " + stringify(providedType) + " and " + stringify(type)));
                });
            });
        });        
    }
    
    function retrieveModelType(environment, entity, name) {
        return types.unfold(list(), environment, entity).flatmap(function (unfoldType) {
            return types.reduce(unfoldType).flatmap(function (definition) {
                var entity = types.instantiate(definition);

                switch (entity.$type) {
                    case 'Typedef':
                        return types.unfold(list(), environment, entity.type).flatmap(function (unfoldType) {
                            return retrieveModelType(environment, unfoldType, name);
                        });

                    case 'Model':
                        return list(entity.params).findFirst(function (param) {
                            return param.name === name;
                        }).map(function (param) {
                            return types.unfold(list(), environment, param.type).map(function (unfoldType) {
                                return types.instantiate(unfoldType);
                            });
                        }).orLazyElse(function() {
                            return aTry.failure(error(entity, "definition '" + name + "' not found in " + stringify(entity)));
                        });

                    case 'Controller':                            
                        return aTry.failure(error(entity, stringify(entity) + " is not a model"));                            

                    default: 
                        return aTry.failure(error(entity, "definition " + name + " not found for " + stringify(entity)));
                }        
            });
        });
    }

    function retrieveCallerType(environment, entity, name) {
        return types.unfold(list(), environment, entity).flatmap(function (unfoldType) {
            return types.reduce(unfoldType).flatmap(function (definition) {
                var entity = types.instantiate(definition);
                switch (entity.$type) {
                    case 'Typedef':
                        return types.unfold(list(), environment, entity.type).flatmap(function (unfoldType) {
                            return retrieveCallerType(environment, unfoldType, name);
                        });

                    case 'Model':
                        return list(entity.params).findFirst(function (param) {
                            return param.name === name;
                        }).map(function (param) {
                            return types.unfold(list(), environment, param.type).map(function (unfoldType) {
                                return types.instantiate(unfoldType);
                            });
                        }).orLazyElse(function() {
                            return aTry.failure(error(entity, "definition '" + name + "' not found in " + stringify(entity)));
                        });

                    case 'Controller':                            
                        return list(entity.specifications).findFirst(function (behavior) {
                            return behavior.name === name;
                        }).map(function (behavior) {
                            return types.unfold(list(), environment, behavior.type).map(function (unfoldType) {
                                return types.instantiate(unfoldType);
                            });
                        }).orLazyElse(function() {
                           return aTry.failure(error(entity, "definition '" + name + "' not found in " + stringify(entity)));
                        });

                    default: 
                        return aTry.failure(error(entity, "definition " + name + " not found for " + stringify(entity)));                            
                }        
            });
        });
    }

    /* 
     * Invocation
     */
    function analyseInvokeExpression(bindings, environment, substitutions, expression, type) {
        return analyseExpression(bindings, environment, substitutions, expression.caller, types.newVar()).flatmap(function (substitutionsAndEntity) {
            return retrieveCallerType(environment, ast.relocate(substitute(substitutions, substitutionsAndEntity._2), expression), expression.name).flatmap(function (methodType) {
                return unifyOrAdapt(environment, expression, substitute(substitutionsAndEntity._1, substitute(substitutions, methodType)), substitute(substitutionsAndEntity._1, type)).map(function (newSubstitutions) {
                    return pair(types.composeSubstitutions(newSubstitutions, substitutionsAndEntity._1), 
                                substitute(substitutionsAndEntity._1,substitute(newSubstitutions, type)));
                });
            });
        });  
    }
    
    /* 
     * Pair
     */    
    function analysePairExpression(bindings, environment, substitutions, expression, type) {
        
        // (a,b) === Pair a b
        
        var ident = ast.namespace(ast.expr.ident("Pair"), getExpressionNamespace(environment, "Pair")),
            newExpression = ast.relocate(ast.expr.application(ast.expr.application(ident, expression.left),expression.right), expression);
        return analyseExpression(bindings, environment, substitutions, newExpression, type);    
    }
    
    /* 
     * Application
     */
    function analyseApplicationExpression(bindings, environment, substitutions, expression, type) {
        var varArgument = types.newVar(),
            result1 = analyseExpression(bindings, environment, substitutions, expression.abstraction, ast.type.abstraction(varArgument, type)).flatmap(function (substitutionsAndAbstraction) {                
                return types.unfold(bindings, environment, substitute(substitutionsAndAbstraction._1, varArgument)).flatmap(function (unfoldType) {
                    var newVarArgument = types.neutralize(unfoldType);
                    return analyseExpression(bindings, environment, types.composeSubstitutions(substitutions, substitutionsAndAbstraction._1), expression.argument, newVarArgument).map(function (substitutionsAndArgument) {
                        var newSubstitutions = types.composeSubstitutions(substitutionsAndArgument._1, substitutionsAndAbstraction._1);
                        return pair(newSubstitutions, substitute(substitutionsAndAbstraction._1, substitute(substitutionsAndArgument._1, type)));
                    });                    
                });
            });
        
        if (result1.isSuccess()) {
            return result1;
        }

        // Invoke requires reverse type checking tactic so lets try it now !

        return analyseExpression(bindings, environment, substitutions, expression.argument, varArgument).flatmap(function (substitutionsAndArgument) {
            return types.unfold(bindings, environment, substitute(substitutionsAndArgument._1, varArgument)).flatmap(function (unfoldType) {
                var newVarArgument = types.neutralize(unfoldType);

                return analyseExpression(bindings, environment, types.composeSubstitutions(substitutions, substitutionsAndArgument._1), expression.abstraction, ast.type.abstraction(newVarArgument, type)).map(function (substitutionsAndAbstraction) {                
                    var newSubstitutions = types.composeSubstitutions(substitutionsAndAbstraction._1, substitutionsAndArgument._1);
                    return pair(newSubstitutions, substitute(substitutionsAndArgument._1, substitute(substitutionsAndAbstraction._1, type)));
                });                    
            });
        });
    }
    
    /* 
     * Comprehension
     */
    function analyseComprehensionExpression(bindings, environment, substitutions, expression, type) {
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
        
        return analyseApplicationExpression(bindings, environment, substitutions, newExpression, type);
    }
    
    /* 
     * Tag
     */
    function analyseTagExpression(bindings, environment, substitutions, expression, type) {
        return list(expression.attributes).foldL(aTry.success(list()), function (newSubstitutions, attribute) {
            return newSubstitutions.flatmap(function (newSubstitutions) {
                var stringType = ast.relocate(getCoreType(environment, 'string'), expression);
                return analyseExpression(bindings, environment, substitutions, attribute[1], stringType).map(function (substitutionsAndAttribute) {
                    return types.composeSubstitutions(types.composeSubstitutions(substitutionsAndAttribute._1, newSubstitutions), substitutions);
                });
            });
        }).flatmap(function (newSubstitutions) {
            return list(expression.body).foldL(aTry.success(newSubstitutions), function (newSubstitutions, body) {
                return newSubstitutions.flatmap(function (newSubstitutions) {
                    return analyseExpression(bindings, environment, substitutions, body, type).map(function (substitutionsAndBody) {
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
    function analyseLetExpression(bindings, environment, substitutions, expression, type) {
        // Must be done using LET type checking rule for generalization purpose
        var newExpression = ast.expr.application(ast.expr.abstraction(expression.name, 
                                                                      expression.body,
                                                                      expression.type),
                                                 expression.value);
        
        return analyseApplicationExpression(bindings, environment, substitutions, ast.relocate(newExpression, expression), type);
    }

    /* 
     * Function
     */
    function analyseAbstractionExpression(bindings, environment, substitutions, expression, type) {
        var varArgument = substitute(substitutions, option.some(expression.type).orLazyElse(function () { return types.newVar(); })), 
            varResult = types.newVar();
        
        return types.unfold(bindings, environment, varArgument).flatmap(function (varArgument) {
            return unifyOrAdapt(environment, expression, ast.type.abstraction(varArgument, varResult), type).flatmap(function (newSubstitutions) {            
                var newBindings = list(pair(expression.param, substitute(newSubstitutions, varArgument))).append(bindings);

                return types.unfold(bindings, environment, substitute(substitutions, substitute(newSubstitutions, varResult))).flatmap(function (newVarResult) {            
                    return analyseExpression(newBindings, environment, substitutions.append(newSubstitutions), expression.body, newVarResult).map(function (substitutionsAndBody) {
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
    
    function analyseNewModelAttribute(bindings, environment, substitutions, expression, type, name) {            
        return retrieveModelType(environment, type, name).flatmap(function(attributeType) {
            return analyseExpression(bindings, environment, substitutions, expression, attributeType);
        });
    }
    
    function analyseNewModel(bindings, environment, substitutions, expression, type) {
        var newSubstitutionsAndType = analyseExpression(bindings, environment, substitutions, expression.model, type);
        
        return list(expression.alter).foldL(newSubstitutionsAndType, function(newSubstitutionsAndType, alter) {
            return newSubstitutionsAndType.flatmap(function(newSubstitutionsAndType) {
                return analyseNewModelAttribute(bindings, environment, substitutions, alter[1], newSubstitutionsAndType._2, alter[0]).map(function(substitutionsAndAlter) {
                    var allSubstitutions = types.composeSubstitutions(substitutionsAndAlter._1, newSubstitutionsAndType._1);
                    return pair(allSubstitutions, substitute(substitutionsAndAlter._1, newSubstitutionsAndType._2));
                });
            });                                              
        });
    }
    
    /* 
     * Expression - main function
     */
    function analyseExpression(bindings, environment, substitutions, expression, type) {
        var result;
        
        switch (expression.$type) {
            case 'NumberExpr':  
                ast.namespace(expression, getTypeNamespace(environment, 'number'));
                result = analyseNative(getCoreType(environment, 'number'), type);
                break;
            case 'StringExpr':
                ast.namespace(expression, getTypeNamespace(environment, 'string'));
                result = analyseNative(getCoreType(environment, 'string'), type);
                break;
            case 'UnitExpr':
                ast.namespace(expression, getTypeNamespace(environment, 'unit'));
                result = analyseNative(getCoreType(environment, 'unit'), type);
                break;
            case 'IdentExpr':
                result = analyseIdentExpression(bindings, environment, substitutions, expression, type);
                break;
            case 'InvokeExpr':
                result = analyseInvokeExpression(bindings, environment, substitutions, expression, type);
                break;
            case 'PairExpr': 
                ast.namespace(expression, getExpressionNamespace(environment, 'Pair'));
                result = analysePairExpression(bindings, environment, substitutions, expression, type);
                break;
            case 'ApplicationExpr':
                if (expression.argument.$type === 'IdentExpr' && !expression.argument.namespace &&
                    !bindings.findFirst(function (binding) { return binding._1 === expression.argument.value;}).isPresent()) {  
                    var newExpression = ast.expr.invoke(expression.abstraction, expression.argument.value);                
                    result = analyseExpression(bindings, environment, substitutions, ast.relocate(newExpression, expression.abstraction), type);
                } else {
                    result = analyseApplicationExpression(bindings, environment, substitutions, expression, type);
                }                                
                break;
            case 'ComprehensionExpr':
                result = analyseComprehensionExpression(bindings, environment, substitutions, expression, type);
                break;
            case 'TagExpr': 
                ast.namespace(expression, getTypeNamespace(environment, 'dom'));
                var elementType = getCoreType(environment, 'dom');
                result = analyseNative(elementType, type).flatmap(function (newSubstitutionsAndType) {
                    return analyseTagExpression(bindings, environment, substitutions, expression, elementType).map(function () {
                        return newSubstitutionsAndType;
                    });
                });
                break;
            case 'LetExpr':
                result = analyseLetExpression(bindings, environment, substitutions, expression, type);
                break;
            case 'AbstractionExpr':
                result = analyseAbstractionExpression(bindings, environment, substitutions, expression, type);
                break;
            case 'NewModelExpr':
                result = analyseNewModel(bindings, environment, substitutions, expression, type);
                break;
            default:
                result = aTry.failure(error(expression, "Cannot typecheck an " + expression.$type));
        }
        
        return result;
    }
    
    Expressions.prototype.analyse = function (bindings, environment, expression, type) {

        return types.unfold(list(), environment, option.some(type).orElse(types.newVar())).flatmap(function (type) {
            return analyseExpression(bindings, environment, list(), expression, type);
        });
    };
    
    return new Expressions();
}());
    
    