/*global exports*/ //, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.types = (function () {
    
    'use strict';
    
    var reflect = require('../Data/reflect.js').reflect,
        pair    = require('../Data/pair.js').pair,
        option  = require('../Data/option.js').option,
        aTry    = require('../Data/atry.js').atry,
        list    = require('../Data/list.js').list,
        ast     = require('../Movico/ast.js').ast;
    
    function Types() {
        this.reset();
    }
    
    Types.prototype.reset = function () {
        this.varnum = 0;
    };
    
    Types.prototype.newVar = function() {
        this.varnum += 1;        
        return ast.type.variable("#" + this.varnum);
    };
    
    Types.prototype.freeVariables = function(aType) {
        var that = this;
        
        switch (reflect.typeof(aType)) {
            case 'TypePolymorphic':
                return this.freeVariables(aType.type).minus(list(aType.variables));
            case 'TypeSpecialize':
                return that.freeVariables(aType.type).append(list(aType.parameters).foldL(list(), function (result, parameter) {
                    return result.append(that.freeVariables(parameter));
                }));
            case 'TypeVariable':
                return list(aType.name);
            case 'TypeFunction':
                return that.freeVariables(aType.argument).append(that.freeVariables(aType.result));
            case 'Model':
            case 'Controller':                
            case 'View':
                return list(aType.variables).foldL(list(), function (result, variable) {
                    return result.append(that.freeVariables(variable));
                });
            default:
                return list();
        }
    };
    
    Types.prototype.generalize = function (nongenerics, aType) {
        var freeVariables = this.freeVariables(aType).minus(nongenerics),
            uniqueVariables = freeVariables.foldR(function (name, result) {
                if (result.contains(name)) {
                    return result;
                }
                
                return list(name).append(result);
            }, list());
        
        if (uniqueVariables.isEmpty()) {
            return aTry.success(aType);
        } 
        
        return aTry.success(ast.type.forall(uniqueVariables.value, aType));
    };
    
    Types.prototype.prune = function(bindings, aType) {
        switch (reflect.typeof(aType)) {
            case 'TypeVariable':
                return bindings.findFirst(function (binding) {
                        return binding._1 === aType.name;
                    }).map(function (binding) {
                        return binding._2;
                    }).orElse(aType);
            
            default:
                return aType;
        }
    };
    
    Types.prototype.varBind = function (name, aType) {
        var that = this;
        
        switch (reflect.typeof(aType)) {
            case 'TypeVariable':
                if (aType.name === name) {
                    return aTry.success(list());
                }
        }
        
        if (that.freeVariables(aType).contains(name)) {
            return aTry.failure(new Error("Cyclic type dependency " + name + " == " + aType));
        } else {
            return aTry.success(list(pair(name,aType)));
        }
    };
    
    Types.prototype.substitute = function (bindings, aType) {
        var that = this;
        
        switch (reflect.typeof(aType)) {
            case 'TypePolymorphic':
                return bindings.findFirst(function (binding) {
                        return aType.variables.indexOf(binding._1) !== -1;
                    }).map(function () {
                        return function () { return aType; };
                    }).orElse(function () { 
                        return ast.type.forall(aType.variables, that.substitute(bindings, aType.type)); 
                    })();
                
            case 'TypeSpecialize':
                return ast.type.specialize(that.substitute(bindings,aType.type),
                                           list(aType.parameters).map(function (parameter) {
                    return that.substitute(bindings, parameter);
                }).value);

            case 'TypeVariable':
                return bindings.findFirst(function (binding) {
                        return binding._1 === aType.name;
                    }).map(function (binding) {
                        return binding._2;
                    }).orElse(aType);
            case 'TypeFunction':
                return ast.type.abstraction(that.substitute(bindings, aType.argument),
                                            that.substitute(bindings, aType.result));
            case 'Model':
                return ast.model(aType.name, list(aType.variables).map(function (variable) {
                    return that.substitute(bindings, variable);
                }).value, list(aType.params).map(function (param) {
                                    return ast.param(param.name, that.substitute(bindings, param.type));
                                 }).value,
                                 option.some(aType.parent).map(function (parent) {
                                    return that.substitute(bindings, parent);
                                 }).orElse(undefined));
            case 'Controller':
                return ast.controller(aType.name, 
                                      list(aType.variables).map(function (variable) {
                                         return that.substitute(bindings, variable);
                                      }).value,
                                      ast.param(aType.param.name, that.substitute(bindings, aType.param.type)), 
                                      list(aType.specifications).map(function (specification) {
                                         return ast.param(specification.name, that.substitute(bindings, specification.type));
                                      }).value,
                                      list(aType.behaviors).map(function(behavior) {
                                         return ast.method(behavior.name, 
                                                           behavior.definition,
                                                           option.some(behavior.caller).map(function (caller) {
                                                              return that.substitute(bindings, caller);
                                                           }).orElse(undefined));
                                      }).value);
            case 'View':
                return ast.view(aType.name, 
                                list(aType.variables).map(function (variable) {
                                   return that.substitute(bindings, variable);
                                }).value,    
                                ast.param(aType.param.name, that.substitute(bindings, aType.param.type)), 
                                aType.body);
            default:
                return aType;
        }
    };
    
    Types.prototype.substituteList = function (substitutions, bindings) {
        var that = this;
        return bindings.map(function (binding) {
            return pair(binding._1, that.substitute(substitutions, binding._2));
        });
    };
    
    Types.prototype.composeSubstitutions = function (bindings1,bindings2) {
        var that = this;
        
        return that.substituteList(bindings1, bindings2).append(bindings1);
    };
        
    Types.prototype.unify = function(aType1, aType2) {
        var that = this;

        switch (reflect.typeof(aType1)) {
            case 'Model':
                if (option.some(aType1.parent).isPresent()) {
                    return that.unify(aType1.parent, aType2);
                }
        }
/*
        switch (reflect.typeof(aType2)) {
            case 'Model':
                if (option.some(aType2.parent).isPresent()) {
                    return that.unify(aType1, aType2.parent);
                }
        }
*/
        switch (reflect.typeof(aType1)) {
            case 'TypePolymorphic':
                return that.unify(that.freshType(aType1).type, aType2);
        }

        switch(reflect.typeof(aType2)) {
            case 'TypePolymorphic':
                return that.unify(aType1, this.freshType(aType2).type);
        }

        switch (reflect.typeof(aType1)) {
            case 'TypeSpecialize':
                return this.reduce(aType1).flatmap(function (aType1) {
                    return that.unify(aType1, aType2);
                });
        }

        switch(reflect.typeof(aType2)) {        
            case 'TypeSpecialize':
                return this.reduce(aType2).flatmap(function (aType2) {
                    return that.unify(aType1, aType2);
                });
        }
        
        switch (reflect.typeof(aType1)) {
            case 'TypeVariable':
                return that.varBind(aType1.name, aType2);
        } 
        
        switch (reflect.typeof(aType2)) {
            case 'TypeVariable':
                return that.varBind(aType2.name, aType1);
        }

        switch (reflect.typeof(aType1) + "*" + reflect.typeof(aType2)) { 
            case 'Model*Model':
            case 'Controller*Controller':
            case 'View*View':
                if (aType1.name !== aType2.name) {
                    return aTry.failure(new Error("Cannot unify " + aType1 + " and " + aType2));                
                }            
                
                return list(aType1.variables).zipWith(list(aType2.variables)).foldL(aTry.success(list()), function (result, pair) {
                    return result.flatmap(function (result) {
                        return that.unify(pair._1, pair._2).map(function (substitutions) {
                            return result.append(substitutions);
                        });
                    });
                });
                
            case 'TypeNative*TypeNative':
                if (aType1.name === aType2.name) {
                    return aTry.success(list());
                }                 
                
                return aTry.failure(new Error("Cannot unify " + aType1 + " and " + aType2));                
                
            case 'TypeFunction*TypeFunction':
                return that.unify(aType2.argument, aType1.argument).flatmap(function (bindingsArgument) {
                    var aResult1 = that.substitute(bindingsArgument, aType1.result),
                        aResult2 = that.substitute(bindingsArgument, aType2.result);
                    return that.unify(aResult1, aResult2).map(function (bindingsResult) {
                        return that.composeSubstitutions(bindingsArgument, bindingsResult);
                    });
                });
                
            default:
                return aTry.failure(new Error("Cannot unify " + aType1 + " and " + aType2));                
        }
    };

    Types.prototype.genericsAndType = function (aType) {
        switch (reflect.typeof(aType)) {
            case 'TypePolymorphic':
                return pair(list(aType.variables), aType.type);
            default:
                return pair(list(), aType);
        }
    };
        
    Types.prototype.reduce = function (aType) {
        switch (reflect.typeof(aType)) {
            case 'TypeSpecialize':
                var genericsAndType = this.genericsAndType(aType.type),
                    parameters = list(aType.parameters);
                
                if (genericsAndType._1.size() !== parameters.size()) {
                    return aTry.failure(new Error("Type " + aType + " is waiting for " + genericsAndType._1.size() + 
                                                  " parametric type instead of " + parameters.size()));
                }
                
                return aTry.success(this.substitute(genericsAndType._1.zipWith(parameters), genericsAndType._2));
            default:
                return aTry.success(aType);
        }
    };
    
    Types.prototype.freshType = function (aType) {
        var that = this, substitutions;
        
        switch (reflect.typeof(aType)) {
            case 'TypePolymorphic':
                substitutions = list(aType.variables).map(function (name) { return pair(name,that.newVar()); });

                return ast.type.forall(substitutions.map(function (p) {
                    return p._2.name; // It's a variable
                }).value, this.substitute(substitutions, aType.type));
                
            default:
                return aType;
        }
    };
    
    Types.prototype.patternOnly = function (aType) {
        switch (reflect.typeof(aType)) {
            case 'TypePolymorphic':
                return this.patternOnly(aType.type);                
            case 'Model':
                return option.some(aType.parent).isPresent();
            default:
                return false;
        }
    };
    
    Types.prototype.builder = function (aType) {
        switch (reflect.typeof(aType)) {
            case 'TypePolymorphic':
                return this.builder(aType.type).map(function (builder) {
                    return ast.type.forall(aType.variables, builder);
                });
                
            case 'Model':
                if (aType.abstract) {
                    return aTry.failure(new Error("Abstract model " + aType.name));
                }
                
                return aTry.success(list(aType.params).foldR(function (param, result) {
                    return ast.type.abstraction(param.type, result);
                }, aType));
                
            case 'Controller':
            case 'View':
                return aTry.success(ast.type.abstraction(aType.param.type,aType)); 
            default:
                return aTry.failure(new Error("Illegal argument"));
        }
        
    };
    
    return new Types();
}());
    
    