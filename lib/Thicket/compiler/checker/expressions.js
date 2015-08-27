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
    
    function substitute(substitutions, aType) {
        return types.substitute(substitutions, aType);
    }

    /*
     * Adapter 
     */    
    
    function adaptAndContinue(environment, expression, providedType, expectedType, initialResult, continuation) {
        var adaptedType = ast.type.abstraction(providedType, expectedType),
            result = environment.adapters().foldL(initialResult, function(unification, entity) {            
                if (unification.isSuccess() || unification.failure().name === 'Abort') {
                    return unification;
                }

                return types.unfold(list(), environment, entity.definition.type).map(function (unfoldType) {
                    return types.reduce(unfoldType).flatmap(function (definition) {
                        return types.instantiate(definition);
                    });
                }).flatmap(function(adapter) {
                    return types.unify(adaptedType, adapter).flatmap(function(newSubstitutions) {
                        return continuation(entity, newSubstitutions, substitute(newSubstitutions, expectedType));
                    });
                });
            });

            
        if (result.isSuccess()) {
            return result;
        } 
        
        return initialResult;
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
                return aTry.failure(error(expression, 
                                          "Unbound variable " + expression.value, 
                                          true));
            });
        }
        
        return binding.flatmap(function (binding) {
            return types.unfold(list(), environment, substitute(substitutions, binding)).flatmap(function (unfoldType) {
                var providedType = types.instantiate(unfoldType);

                return types.unify(providedType, type).map(function (newSubstitutions) {
                    return aTry.success(pair(newSubstitutions,substitute(newSubstitutions, type)));
                }).lazyRecoverWith(function(anError) {
                    return aTry.failure(error(expression, 
                                              "Cannot unify " + stringify(providedType) + " and " + stringify(type), 
                                              anError.name === "Abort"));
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
                            return aTry.failure(error(entity, 
                                                      "attribute '" + name + "' not found in " + stringify(entity), 
                                                      true));
                        });

                    case 'Controller':                            
                        return aTry.failure(error(entity, 
                                                  stringify(entity) + " is not a model. Attribute " + name + " not found", 
                                                  true));     
                        
                    case 'TypeVariable':
                        return aTry.failure(error(entity, 
                                                  "attribute " + name + " not found in " + stringify(entity)));                            

                    default: 
                        return aTry.failure(error(entity, 
                                                  "attribute " + name + " not found for " + stringify(entity),
                                                  true));
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
                            return aTry.failure(error(entity, 
                                                      "definition '" + name + "' not found in " + stringify(entity), 
                                                      true));
                        });

                    case 'Controller':                            
                        return list(entity.specifications).findFirst(function (behavior) {
                            return behavior.name === name;
                        }).map(function (behavior) {
                            return types.unfold(list(), environment, behavior.type).map(function (unfoldType) {
                                return types.instantiate(unfoldType);
                            });
                        }).orLazyElse(function() {
                           return aTry.failure(error(entity, 
                                                     "definition '" + name + "' not found in " + stringify(entity), 
                                                     true));
                        });
                        
                    case 'TypeVariable':
                        return aTry.failure(error(entity, 
                                                  "definition " + name + " not found for " + stringify(entity)));                            

                    default: 
                        return aTry.failure(error(entity, 
                                                  "definition " + name + " not found for " + stringify(entity),
                                                  true));
                }        
            });
        });
    }

    /* 
     * Invocation
     */
    function analyseInvokeExpression(bindings, environment, substitutions, expression, type) {
        return analyseExpression(bindings, 
                                 environment, 
                                 substitutions, 
                                 expression.caller, 
                                 types.newVar()).flatmap(function (substitutionsAndEntity) {
            return retrieveCallerType(environment, 
                                      ast.relocate(substitute(substitutions, substitutionsAndEntity._2), expression), 
                                      expression.name).flatmap(function (methodType) {
                return types.unify(substitute(substitutionsAndEntity._1, substitute(substitutions, methodType)), 
                                   substitute(substitutionsAndEntity._1, type)).map(function (newSubstitutions) {
                    return pair(types.composeSubstitutions(newSubstitutions, substitutionsAndEntity._1), 
                                substitute(substitutionsAndEntity._1,substitute(newSubstitutions, type)));
                });
            });
        });  
    }
    
    /* 
     * Application
     */ 
    function analyseApplicationExpressionBodyFirst(argumentType, bindings, environment, substitutions, expression, type) {
        return analyseExpression(bindings, 
                                 environment,
                                 substitutions,
                                 expression.abstraction,
                                 ast.type.abstraction(argumentType, type)).flatmap(function (substitutionsAndArgument) {                
            return types.unfold(bindings, environment, substitute(substitutionsAndArgument._1, argumentType)).flatmap(function (unfoldType) {
                var newVarArgument = types.neutralize(unfoldType),
                    providedType = types.newVar(),
                    allSubtitutions = types.composeSubstitutions(substitutions, substitutionsAndArgument._1),
                    initialResult = analyseExpression(bindings, 
                                                      environment, 
                                                      allSubtitutions, 
                                                      expression.argument, 
                                                      newVarArgument).map(function (substitutionsAndAbstraction) {                
                        var newSubstitutions = types.composeSubstitutions(substitutionsAndAbstraction._1, substitutionsAndArgument._1);
                        return pair(newSubstitutions, substitute(substitutionsAndArgument._1, substitute(substitutionsAndAbstraction._1, type)));
                    });                    
                
                return adaptAndContinue(environment, 
                                        expression.abstraction,
                                        providedType,
                                        newVarArgument, 
                                        initialResult, 
                                        function(entity, adaptedSubstitutions) {
                    return analyseExpression(bindings, 
                                             environment, 
                                             types.composeSubstitutions(allSubtitutions, adaptedSubstitutions), 
                                             expression.argument, 
                                             substitute(adaptedSubstitutions, providedType)).map(function (substitutionsAndAbstraction) {                
                        var newSubstitutions = types.composeSubstitutions(substitutionsAndAbstraction._1, 
                                                                          types.composeSubstitutions(adaptedSubstitutions, 
                                                                                                     substitutionsAndArgument._1));
                        ast.adapted(expression.argument, ast.namespace(ast.expr.ident(entity.name), entity.namespace));
                        return pair(newSubstitutions, substitute(substitutionsAndArgument._1, 
                                                                 substitute(adaptedSubstitutions, 
                                                                            substitute(substitutionsAndAbstraction._1, type))));
                    });                    
                });
            });
        });
    }
    
    function analyseApplicationExpressionArgumentFirst(argumentType, bindings, environment, substitutions, expression, type) {
        return analyseExpression(bindings, 
                                 environment,
                                 substitutions, 
                                 expression.argument, 
                                 argumentType).flatmap(function (substitutionsAndArgument) {            
            return types.unfold(bindings, environment, substitute(substitutionsAndArgument._1, argumentType)).flatmap(function (unfoldType) {
                var newVarArgument = types.neutralize(unfoldType),
                    allSubtitutions = types.composeSubstitutions(substitutions, substitutionsAndArgument._1),
                    initialResult = analyseExpression(bindings, 
                                                      environment, 
                                                      allSubtitutions, 
                                                      expression.abstraction, 
                                                      ast.type.abstraction(newVarArgument, type)).map(function (substitutionsAndAbstraction) {                
                        var newSubstitutions = types.composeSubstitutions(substitutionsAndAbstraction._1, substitutionsAndArgument._1);
                        return pair(newSubstitutions, substitute(substitutionsAndArgument._1, substitute(substitutionsAndAbstraction._1, type)));
                    });                    
                
                return adaptAndContinue(environment, 
                                        expression.abstraction,
                                        newVarArgument, 
                                        types.newVar(),
                                        initialResult, 
                                        function(entity, adaptedSubstitutions, adaptedType) {
                    return analyseExpression(bindings, 
                                             environment, 
                                             types.composeSubstitutions(allSubtitutions, adaptedSubstitutions), 
                                             expression.abstraction, 
                                             ast.type.abstraction(adaptedType, type)).map(function (substitutionsAndAbstraction) {                
                        var newSubstitutions = types.composeSubstitutions(substitutionsAndAbstraction._1, 
                                                                          types.composeSubstitutions(adaptedSubstitutions, 
                                                                                                     substitutionsAndArgument._1));
                        ast.adapted(expression.argument, ast.namespace(ast.expr.ident(entity.name),entity.namespace));
                        return pair(newSubstitutions, substitute(substitutionsAndArgument._1, 
                                                                 substitute(adaptedSubstitutions, 
                                                                            substitute(substitutionsAndAbstraction._1, type))));
                    });                    
                });
            });
        });
    }

    function analyseApplicationExpression(bindings, environment, substitutions, expression, type) {    
        var argumentType = types.newVar();

        if (expression.argument.$type === "AbstractionExpr") {
            return analyseApplicationExpressionBodyFirst(argumentType, bindings, environment, substitutions, expression, type);
        } else {
            return analyseApplicationExpressionArgumentFirst(argumentType, bindings, environment, substitutions, expression, type);
        }
    }
    
    /* 
     * Let expression
     */    
    function analyseLetExpressionBodyFirst(argumentType, bindings, environment, substitutions, expression, type) {
        var newBindings = list(pair(expression.name, argumentType)).append(bindings);
        
        return analyseExpression(newBindings, 
                                 environment, 
                                 substitutions, 
                                 expression.body, 
                                 type).flatmap(function (substitutionsAndBody) {            
            return types.unfold(newBindings, environment, substitute(substitutionsAndBody._1, argumentType)).flatmap(function (unfoldType) {
                var newVarArgument = types.generalize(unfoldType);

                return analyseExpression(bindings, 
                                         environment, 
                                         types.composeSubstitutions(substitutions, substitutionsAndBody._1), 
                                         expression.value, 
                                         newVarArgument).map(function (substitutionsAndAbstraction) {                
                    var newSubstitutions = types.composeSubstitutions(substitutionsAndAbstraction._1, substitutionsAndBody._1);
                    return pair(newSubstitutions, substitute(substitutionsAndBody._1, substitute(substitutionsAndAbstraction._1, type)));
                });                    
            });
        });
    }

    function analyseLetExpressionValueFirst(argumentType, bindings, environment, substitutions, expression, type) {
        return analyseExpression(bindings, 
                                 environment, 
                                 substitutions, 
                                 expression.value, 
                                 argumentType).flatmap(function (substitutionsAndArgument) {
            return types.unfold(bindings, environment, substitute(substitutionsAndArgument._1, argumentType)).flatmap(function (unfoldType) {
                var newVarArgument = types.generalize(unfoldType),
                    newBindings = list(pair(expression.name, newVarArgument)).append(bindings);

                return analyseExpression(newBindings,
                                         environment, 
                                         types.composeSubstitutions(substitutions, substitutionsAndArgument._1), 
                                         expression.body, 
                                         type).map(function (substitutionsAndBody) {                
                    var newSubstitutions = types.composeSubstitutions(substitutionsAndBody._1, substitutionsAndArgument._1);
                    return pair(newSubstitutions, substitute(substitutionsAndArgument._1, substitute(substitutionsAndBody._1, type)));
                });                    
            });
        });      
    }
    
    function analyseLetExpression(bindings, environment, substitutions, expression, type) {
        var argumentType = expression.type || types.newVar();
            
        if (expression.value.$type === "AbstractionExpr") {
            return analyseLetExpressionBodyFirst(argumentType, bindings, environment, substitutions, expression, type);
        } else {
            return analyseLetExpressionValueFirst(argumentType, bindings, environment, substitutions, expression, type);
        }
    }

    /* 
     * Function
     */
    function analyseAbstractionExpression(bindings, environment, substitutions, expression, type) {
        var argumentType = substitute(substitutions, option.some(expression.type).orLazyElse(function () { return types.newVar(); })), 
            varResult = types.newVar();
        
        return types.unfold(bindings, environment, argumentType).flatmap(function (argumentType) {
            return types.unify(ast.type.abstraction(argumentType, varResult), type).flatmap(function (newSubstitutions) {            
                var newBindings = list(pair(expression.param, substitute(newSubstitutions, argumentType))).append(bindings);

                return types.unfold(bindings, 
                                    environment, 
                                    substitute(substitutions, substitute(newSubstitutions, varResult))).flatmap(function (newVarResult) {            
                    return analyseExpression(newBindings, 
                                             environment,
                                             substitutions.append(newSubstitutions),
                                             expression.body, 
                                             newVarResult).map(function (substitutionsAndBody) {
                        var allSubstitutions = types.composeSubstitutions(substitutionsAndBody._1, newSubstitutions);
                        return pair(allSubstitutions, substitute(substitutionsAndBody._1, 
                                                                 substitute(newSubstitutions, 
                                                                            substitute(newSubstitutions, type))));
                    });
                });
            });
        });
    }

    /*
     * Native
     */
    function analyseNative(nativeType, type) {
        return types.unify(nativeType, type).map(function(newSubstitutions) {
            return pair(newSubstitutions, substitute(newSubstitutions, type));
        });
    }
    
    /*
     * Model alteration
     */
    function analyseNewModelAttribute(bindings, environment, substitutions, expression, type, name) {            
        return retrieveModelType(environment, type, name).flatmap(function(attributeType) {
            return analyseExpression(bindings, environment, substitutions, expression, attributeType);
        });
    }
    
    function analyseNewModel(bindings, environment, substitutions, expression, type) {
        var newSubstitutionsAndType = analyseExpression(bindings, environment, substitutions, expression.model, type);
        
        return list(expression.alter).foldL(newSubstitutionsAndType, function(newSubstitutionsAndType, alter) {
            return newSubstitutionsAndType.flatmap(function(newSubstitutionsAndType) {
                return analyseNewModelAttribute(bindings, 
                                                environment,
                                                substitutions, 
                                                alter[1], 
                                                newSubstitutionsAndType._2, alter[0]).map(function(substitutionsAndAlter) {
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
        switch (expression.$type) {
            case 'NativeExpr':  
                ast.namespace(expression, getTypeNamespace(environment, 'native'));
                return analyseNative(getCoreType(environment, 'native'), type);
            case 'IdentExpr':
                return analyseIdentExpression(bindings, environment, substitutions, expression, type);
            case 'InvokeExpr':
                return analyseInvokeExpression(bindings, environment, substitutions, expression, type);
            case 'ApplicationExpr':
                if (expression.argument.$type === 'IdentExpr' && !expression.argument.namespace &&
                    !bindings.findFirst(function (binding) { return binding._1 === expression.argument.value;}).isPresent()) {  
                    var newExpression = ast.relocate(ast.expr.invoke(expression.abstraction, expression.argument.value), expression);                
                    return analyseExpression(bindings, environment, substitutions, newExpression, type);
                }
                
                return analyseApplicationExpression(bindings, environment, substitutions, expression, type);                
            case 'LetExpr':
                return analyseLetExpression(bindings, environment, substitutions, expression, type);
            case 'AbstractionExpr':
                return analyseAbstractionExpression(bindings, environment, substitutions, expression, type);
            case 'NewModelExpr':
                return analyseNewModel(bindings, environment, substitutions, expression, type);
            default:
                return aTry.failure(error(expression, 
                                          "Cannot typecheck an " + expression.$type, 
                                          true));
        }
    }
    
    Expressions.prototype.analyse = function (bindings, environment, expression, type) {

        return types.unfold(list(), environment, option.some(type).orElse(types.newVar())).flatmap(function (type) {
            return analyseExpression(bindings, environment, list(), expression, type);
        });
    };
    
    return new Expressions();
}());
    