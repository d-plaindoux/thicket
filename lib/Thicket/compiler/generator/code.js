/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var option   = require('../../../Data/option.js'),
        aTry     = require('../../../Data/atry.js'),
        list     = require('../../../Data/list.js'),
        ast      = require('../syntax/ast.js');
    
    function abstractSyntax() {
        var args = Array.prototype.slice.call(arguments),
            struct = {};        
        struct.$type = args[0];
        struct.$values = args.slice(1);
        return struct;
    }

    function normalizeApplication(bindings, expression) {
        var newExpression;

        if (expression.argument.$type === 'IdentExpr' && 
            !expression.argument.namespace && 
            !bindings.contains(expression.argument.value)) {  
            newExpression = ast.expr.invoke(expression.abstraction, expression.argument.value);                
            return normalizeExpression(bindings, newExpression);
        } else {
            return normalizeExpression(bindings, expression.abstraction).flatmap(function (abstraction) {
                return normalizeExpression(bindings, expression.argument).map(function (argument) {
                    if ((argument.$type === "Apply" || argument.$type === "Ident")) {
                        return abstractSyntax("Apply", abstraction, abstractSyntax("Lazy", argument));
                    } else {
                        return abstractSyntax("Apply", abstraction, argument);
                    }
                });
            });
        }                
    }
    
    function normalizeAdapter(expression) {
        if (expression.hasOwnProperty("adapted")) {
            var identifier = expression.adapted;
            delete expression.adapted;
            return ast.expr.application(identifier, expression);
        } else {
            return expression;
        }                
    }
        
    function normalizeExpression(bindings, expressionToNormalize) {
        function fullyQualifiedName(name) {
            return expression.namespace ? expression.namespace + "." + name : name;            
        }
        
        var newExpression,
            expression = normalizeAdapter(expressionToNormalize);

        switch (expression.$type) {
            case 'NativeExpr':
                return aTry.success(abstractSyntax("Native",expression.value));
            case 'IdentExpr':
                if (bindings.contains(expression.value)) {
                    return aTry.success(abstractSyntax("Variable", expression.value));
                }

                return aTry.success(abstractSyntax("Ident", 
                                                   fullyQualifiedName(expression.value)));
            case 'InvokeExpr':
                return normalizeExpression(bindings, expression.caller).map(function (caller) {
                    return abstractSyntax("Invoke", caller , expression.name);
                });
            case 'ApplicationExpr':
                return normalizeApplication(bindings, expression, true);
            case 'LetExpr': // OK
                newExpression = ast.expr.application(ast.expr.abstraction(expression.name, 
                                                                          expression.body,
                                                                          expression.type),
                                                     expression.value);
                
                return normalizeApplication(bindings, newExpression, false); 
            case 'AbstractionExpr': // OK
                return normalizeExpression(bindings.add(expression.param), expression.body).map(function (body) {
                    return abstractSyntax("Function", expression.param, body);
                });
            case 'NewModelExpr': //
                var model = normalizeExpression(bindings, expression.model);
                
                return list(expression.alter).foldL(model,function(result,alter) {
                    return model.flatmap(function(model) {
                        return normalizeExpression(bindings, alter[1]).map(function(alteredExpression) {
                            return abstractSyntax("Alter", model, alter[0], alteredExpression);
                        });
                    });
                });                
            default:
                return aTry.failure(new Error("Cannot generate code for " + JSON.stringify(expression)));
        }
    }   
    
    function typeName(environment, aType) {
        switch (aType.$type) {
            case 'TypePolymorphic':
                return typeName(environment, aType.type);
            case 'TypeSpecialize':
                return typeName(environment, aType.type);                
            case 'TypeVariable':
                return environment.getType(aType.namespace, aType.name).map(function(aType) {
                    return typeName(environment, aType);
                }).lazyRecoverWith(function() {
                    return option.some(aType.name);
                });
            case 'TypeFunction':
                return option.none();
            case 'TypeNative':
            case 'Model':
            case 'Controller':                
                return option.some(aType.name);
            case 'Typedef':
                return typeName(environment, aType.type);
            default:
                return option.none();
        }
    }
	
    function normalizeController(environment, controller) {
        return list(controller.behaviors).foldL(aTry.success(list()), function (result,behavior) {
            return result.flatmap(function(result) {
                return normalizeExpression(list('self',controller.param.name), behavior.definition).map(function (expression) {
                    var callerName = option.some(behavior.caller).map(function (caller) {
                        return typeName(environment, caller).map(function(name) {
                            return name + '.';
                        }).orElse("");
                    }).orElse("");

                    return result.add([callerName + behavior.name , expression]);
                });
            });
        }).map(function (result) {
            return abstractSyntax("Controller", controller.name, controller.param.name, result.value);
        });
    }
          
    function normalizeModel(model) {        
        return list(model.params).foldL(aTry.success(list()), function (result, param) {
            return result.map(function (result) {
                return result.add(param.name);
            });
        }).map(function (body) {
            return abstractSyntax("Model", model.name, body.value);
        });
    }
    
    function normalizeDefinition(definition) {        
        return normalizeExpression(list(), definition.expr).map(function (body) {
            return abstractSyntax("Definition", definition.name, body);
        });
    }

    function normalizeEntity(environment, anEntity) {
        switch (anEntity.$type) {
            case 'TypePolymorphic':
                return normalizeEntity(environment, anEntity.type);

            case 'Model':
                return normalizeModel(anEntity);
                
            case 'Controller':                
                return normalizeController(environment, anEntity);
                
            case 'Expression':
                return normalizeDefinition(anEntity);
                
            case 'Typedef':
                return aTry.failure(new Error("Cannot normalize"));
        }
    }
    
    function normalizeSentence(expression) {
        return normalizeExpression(list(),expression);
    }
    
    return {
        abstractSyntax : abstractSyntax,
        entity: normalizeEntity,
        expression: normalizeExpression,
        sentence: normalizeSentence
    };

}());