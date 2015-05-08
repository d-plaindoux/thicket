/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

/* QUICK AND DIRTY transpiler -- for validation purpose only */

module.exports = (function () {
    
    'use strict';
    
    var option   = require('../../Data/option.js'),
        aTry     = require('../../Data/atry.js'),
        list     = require('../../Data/list.js'),
        builder  = require('../checker/builder.js'),
        types    = require('../checker/types.js'),
        entities = require('../checker/entities.js'),
        ast      = require('../syntax/ast.js');
    
    function objCode() {
        var args = Array.prototype.slice.call(arguments),
            struct = {};        
        struct[args[0]] = args.slice(1);
        return struct;
    }

    function compileApplication(namespace, environment, variables, expression, lazy) {
        var newExpression;

        if (expression.argument.$type === 'IdentExpr' && 
            !environment.contains(expression.argument.value) && 
            !variables.contains(expression.argument.value)) {  
            newExpression = ast.expr.invoke(expression.abstraction, expression.argument.value);                
            return compileExpression(namespace, environment, variables, newExpression);
        } else {
            return compileExpression(namespace, environment, variables, expression.abstraction).flatmap(function (abstraction) {
                return compileExpression(namespace, environment, variables, expression.argument).map(function (argument) {
                    if (lazy) {
                        return objCode("Apply", abstraction, argument);
                    } else {
                        return objCode("Apply", abstraction, objCode("Eval", argument));
                    }
                });
            });
        }                
    }
    
    function compileExpression(namespace, environment, variables, expression) {
        var newExpression;

        switch (expression.$type) {
            case 'NumberExpr':
                return aTry.success(objCode("Number", expression.value));
            case 'StringExpr':
                return aTry.success(objCode("String", expression.value));
            case 'UnitExpr':
                return aTry.success(objCode("Unit"));
            case 'IdentExpr':
                if (variables.contains(expression.value)) {
                    return aTry.success(objCode("Variable", normalize(expression.value)));
                } else if (namespace && namespace.length > 0) {
                    return aTry.success(objCode("Ident", expression.value, namespace.join(".")));
                }
                
                return aTry.success(objCode("Ident", expression.value));
            case 'InvokeExpr':
                return compileExpression(namespace, environment, variables, expression.caller).map(function (caller) {
                    return objCode("Invoke", caller , expression.name);
                });
            case 'PairExpr':
                newExpression = ast.expr.application(ast.expr.application(ast.expr.ident("Pair"), expression.left),expression.right);
                return compileExpression(namespace, environment, variables, newExpression);
            case 'ApplicationExpr':
                return compileApplication(namespace, environment, variables, expression, true);
            case 'ComprehensionExpr': // OK
                var iteration = expression.iterations[0],
                    iterations = expression.iterations.slice(1);

                // [ p for a in La for b in Lb if C1 ] === Lb.flatmap(b -> La.filter(a -> C1).map(a -> p))

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
                
                return compileExpression(namespace, environment, variables, newExpression);
            case 'TagExpr': 
                return list(expression.attributes).foldL(aTry.success(list()),function (result, attribute) {
                    return result.flatmap(function (result) {
                        return compileExpression(namespace, environment, variables, attribute[1]).map(function (value) {
                            return result.add([ attribute[0] , value ]);
                        });
                    });
                }).flatmap(function (attributes) {
                    return list(expression.body).foldL(aTry.success(list()),function (result,body) {
                        return result.flatmap(function (result) {
                            return compileExpression(namespace, environment,variables,body).map(function (body) {
                                return result.add(body);
                            });
                        });
                    }).map(function (body) {
                        return objCode("Tag", expression.name , attributes.value , body.value );
                    });
                });
            case 'LetExpr': // OK
                newExpression = ast.expr.application(ast.expr.abstraction(expression.name, 
                                                                          expression.body,
                                                                          expression.type),
                                                     expression.value);
                
                return compileApplication(namespace, environment, variables, newExpression, false); 
            case 'AbstractionExpr': // OK
                return compileExpression(namespace, environment, variables.add(expression.param), expression.body).map(function (body) {
                    return objCode("Function", normalize(expression.param), body);
                });
            default:
                return aTry.failure(new Error("Cannot generate code for " + expression));
        }
    }   
    
    function typeName(substitutions, aType) {
        switch (aType.$type) {
            case 'TypePolymorphic':
                return typeName(substitutions, aType.type);
            case 'TypeSpecialize':
                return typeName(substitutions, aType.type);                
            case 'TypeVariable':
                var newType = types.substitute(substitutions, aType);
                // Prevent infinite loop | return the variable name ...
                if (aType === newType) {
                    return option.some(aType.name);
                }
                return typeName(substitutions, newType);
            case 'TypeFunction':
                return option.none();
            case 'TypeNative':
            case 'Model':
            case 'Controller':                
            case 'View':
                return option.some(aType.name);
            case 'Typedef':
                return typeName(substitutions, aType.type);
            default:
                return option.none();
        }
    }
  
	//
	// Controller, View and Model compilation
	//
    
    function normalize(name) {
        return name.split('').map(function (c) {
            if (c >= 'a' && c <= 'z') {
                return c;
            } else if (c >= 'A' && c <= 'Z') {
                return c;
            } else if (c >= '0' && c <= '9') {
                return c;
            } else if (c === '_' || c === '$') {
                return c;
            } else {
                return '_' + c.charCodeAt(0);
            }
            
        }).join('');
    }
    
    function getVariables(environment) {
        return environment.map(function (entity) { 
            return builder.entityName(entity); 
        });
    }
	
    function compileController(environment, controller) {
        var specifications = entities.specifications(option.some(environment.value)),
            variables = getVariables(environment);
        
        return list(controller.behaviors).foldL(aTry.success(list()), function (result,behavior) {
            return result.flatmap(function(result) {
                return compileExpression([], variables, list('self',controller.param.name), behavior.definition).map(function (expression) {
                    var callerName = option.some(behavior.caller).map(function (caller) {
                        return typeName(specifications, caller).map(function(name) {
                            return name + '.';
                        }).orElse("");
                    }).orElse("");

                    return result.add([callerName + behavior.name , expression]);
                });
            });
        }).map(function (result) {
            return objCode("Controller", controller.name, normalize(controller.param.name), result.value);
        });
    }

    function compileView(environment, view) {
        var variables = getVariables(environment);
        
        return list(view.body).foldL(aTry.success(list()),function (result,body) {
            return result.flatmap(function (result) {
                return compileExpression([], variables, list('self',view.param.name), body).map(function (body) {
                    return result.add(body);
                });
            });
        }).map(function (result) {
            return objCode("View", view.name, normalize(view.param.name), result.value);
        });
    }
               
    function compileModel(model) {        
        return list(model.params).foldL(aTry.success(list()), function (result, param) {
            return result.map(function (result) {
                return result.add(normalize(param.name));
            });
        }).map(function (body) {
            return objCode("Model", model.name, body.value);
        });
    }
    
    function compileDefinition(environment, definition) {        
        var variables = getVariables(environment);
        
        return compileExpression(['*'], variables, list(), definition.expr).map(function (body) {
            return objCode("Definition", definition.name, body);
        });
    }

    function compileEntity(environment, entity) {
        switch (entity.$type) {
            case 'TypePolymorphic':
                return compileEntity(environment, entity.type);

            case 'Model':
                return compileModel(entity);
                
            case 'Controller':                
                return compileController(environment, entity);
                
            case 'View':
                return compileView(environment, entity);
                
            case 'Expression':
                return compileDefinition(environment, entity);
                
            case 'Typedef':
                return aTry.success(null);
        }
    }
    
    function compileSentence(environment, expression) {
        var variables = environment.map(function (entity) { 
            return builder.entityName(entity); 
        });

        return compileExpression([], variables,list(),expression);
    }
    
    return {
        objCode : objCode,
        entity: compileEntity,
        expression: function (environment, variables, expression) { return compileExpression([], environment, variables, expression); },
        sentence: compileSentence
    };

}());