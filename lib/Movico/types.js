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
        aTry    = require('../Data/atry.js').atry,
        list    = require('../Data/list.js').list,
        ast     = require('../Movico/ast.js').ast;
    
    function Types() {
        this.varnum = 0;
    }
    
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
                return that.freeVariables(aType.type).append(that.freeVariables(aType.param));
            case 'TypeVariable':
                return list(aType.name);
            case 'TypeFunction':
                return that.freeVariables(aType.argument).append(that.freeVariables(aType.result));
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
            return aTry.failure(new Error("Cyclic type dependency"));
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
                                           that.substitute(bindings,aType.param));

            case 'TypeVariable':
                return bindings.findFirst(function (binding) {
                        return binding._1 === aType.name;
                    }).map(function (binding) {
                        return binding._2;
                    }).orElse(aType);
            case 'TypeFunction':
                return ast.type.abstraction(that.substitute(bindings, aType.argument),
                                            that.substitute(bindings, aType.result));
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
            case 'TypeVariable':
                return that.varBind(aType1.name, aType2);
        } 
        
        switch (reflect.typeof(aType2)) {
            case 'TypeVariable':
                return that.varBind(aType2.name, aType1);
        }

        switch (reflect.typeof(aType1)) {
            case 'TypePolymorphic':
                switch(reflect.typeof(aType2)) {
                    case 'TypePolymorphic':
                        return that.unify(aType1.type, 
                                          that.substitute(list(pair(aType2.variable, ast.type.variable(aType1.variable))), aType2.type));
                    default:
                        return that.unify(aType1.type, aType2);
                }
                break;
            default:
                switch(reflect.typeof(aType2)) {
                    case 'TypePolymorphic':
                        return that.unify(aType1, aType2.type);
                }
        }
        
        switch (reflect.typeof(aType1) + "*" + reflect.typeof(aType2)) { 
            case 'TypeNative*TypeNative':
                if (aType1.name === aType2.name) {
                    return aTry.success(list());
                }                 
                return aTry.failure(new Error("Cannot unify " + aType1 + " and " + aType2));                
                
            case 'TypeFunction*TypeFunction':
                return that.unify(aType1.argument, aType2.argument).flatmap(function (bindingsArgument) {
                    var aResult1 = that.substitute(bindingsArgument, aType1.result),
                        aResult2 = that.substitute(bindingsArgument, aType2.result);
                    return that.unify(aResult1, aResult2).map(function (bindingsResult) {
                        return that.composeSubstitutions(bindingsArgument, bindingsResult);
                    });
                });
                
            case 'TypeFunction*Model':            
                if (list(aType2.params).isEmpty()) {
                    return aTry.failure(new Error("Cannot unify " + aType1 + " and " + aType2));                
                } 
                
                return this.unify(aType1, list(aType2.params).foldR(function (param, result) {
                    return ast.type.abstraction(param.type, result);
                }, aType2));

            case 'Model*TypeFunction':
                if (list(aType1.params).isEmpty()) {
                    return aTry.failure(new Error("Cannot unify " + aType1 + " and " + aType2));                
                } 
                  
                return this.unify(list(aType1.params).foldR(function (param, result) {
                    return ast.type.abstraction(param.type, result);
                }, aType1), aType2);
                
            case 'TypeFunction*Controller':
            case 'TypeFunction*View':
                return this.unify(aType1, ast.type.abstraction(aType2.param.type,aType2));

            case 'Controller*TypeFunction':
            case 'View*TypeFunction':
                return this.unify(ast.type.abstraction(aType1.param.type,aType1), aType2);
                
            case 'TypeSpecialize*TypeSpecialize':
                return this.unify(aType1.type, aType2.type).flatmap(function (bindingsFirst) {
                    var aSecond1 = that.substitute(bindingsFirst, aType1.param),
                        aSecond2 = that.substitute(bindingsFirst, aType2.param);
                    return that.unify(aSecond1, aSecond2).map(function (bindingsSecond) {
                        return that.composeSubstitutions(bindingsFirst, bindingsSecond);
                    });
                });
                
            default:
                return aTry.failure(new Error("Cannot unify " + aType1 + " and " + aType2));                
        }
    };
    
    return new Types();
}());
    
    