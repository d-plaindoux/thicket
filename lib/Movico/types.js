/*global exports*/ //, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.types = (function () {
    
    'use strict';
    
    var type = require('../Data/type.js').type,
        pair = require('../Data/pair.js').pair,
        aTry = require('../Data/atry.js').atry,
        list = require('../Data/list.js').list,
        ast = require('../Movico/ast.js').ast;
    
    function freeVariables(aType) {
        switch (type.get(aType)) {
            case 'TypePolymorphic':
                return freeVariables(aType.type).filter(function (name) {
                    return name !== aType.variable;
                });
            case 'TypeVariable':
                return list(aType.name);
            case 'TypeArray':
                return freeVariables(aType.type);
            case 'TypeFunction':
                return freeVariables(aType.argument).append(freeVariables(aType.result));
            case 'TypePair':
                return freeVariables(aType.first).append(freeVariables(aType.second));
            default:
                return list();
        }
    }
    
    function prune(bindings, aType) {
        switch (type.get(aType)) {
            case 'TypeVariable':
                return bindings.findFirst(function (binding) {
                        return binding._1 === aType.name;
                    }).map(function (binding) {
                        return binding._2;
                    }).orElse(aType);
            
            default:
                return aType;
        }
    }
    
    function varBind(name, aType) {
        switch (type.get(aType)) {
            case 'TypeVariable':
                if (aType.name === name) {
                    return aTry.success(list());
                }
        }
        
        if (freeVariables(aType).contains(name)) {
            return aTry.failure(new Error("cyclic type dependency"));
        } else {
            return aTry.success(list(pair(name,aType)));
        }
    }
    
    function substitute(bindings, aType) {
        switch (type.get(aType)) {
            case 'TypeVariable':
                return bindings.findFirst(function (binding) {
                        return binding._1 === aType.name;
                    }).map(function (binding) {
                        return binding._2;
                    }).orElse(aType);
            case 'TypeArray':
                return ast.type.array(substitute(bindings, aType.type));
            case 'TypeFunction':
                return ast.type.abstraction(substitute(bindings, aType.argument),substitute(bindings, aType.result));
            case 'TypePair':
                return ast.type.pair(substitute(bindings, aType.first),substitute(bindings, aType.second));
            default:
                return aType;
        }
    }
    
    function unify(aType1, aType2) {
        switch (type.get(aType1)) {
            case 'TypeVariable':
                return varBind(aType1.name, aType2);
        } 
        
        switch (type.get(aType2)) {
            case 'TypeVariable':
                return varBind(aType2.name, aType1);
        }
        
        switch (type.get(aType1)+"*"+type.get(aType2)) {             
            case 'TypeNative*TypeNative':
                if (aType1.name === aType2.name) {
                    return aTry.success(list());
                }                 
                return aTry.failure(new Error("Cannot unify " + aType1 + " and " + aType2));                
                
            case 'TypeArray*TypeArray':
                return unify(aType1.type, aType2.type);
                
            case 'TypeFunction*TypeFunction':
                return unify(aType1.argument, aType2.argument).flatmap(function (bindingsArgument) {
                    var aResult1 = substitute(bindingsArgument, aType1.result),
                        aResult2 = substitute(bindingsArgument, aType2.result);
                    return unify(aResult1, aResult2).map(function (bindingsResult) {
                        return bindingsResult.map(function (binding) {
                            return pair(binding._1, substitute(bindingsArgument, binding._2));
                        }).append(bindingsArgument);
                    });
                });
                
            case 'TypePair*TypePair':
                return unify(aType1.first, aType2.first).flatmap(function (bindingsFirst) {
                    var aSecond1 = substitute(bindingsFirst, aType1.second),
                        aSecond2 = substitute(bindingsFirst, aType2.second);
                    return unify(aSecond1, aSecond2).map(function (bindingsSecond) {
                        return bindingsSecond.map(function (binding) {
                            return pair(binding._1, substitute(bindingsFirst, binding._2));
                        }).append(bindingsFirst);
                    });
                });
                
            default:
                return aTry.failure(new Error("Cannot unify " + aType1 + " and " + aType2));                
        }
    }
    
    return {
        freeVariables : function (aType) { 
            return freeVariables(aType);
        },
        prune : function (bindings, aType) {
            return prune(bindings, aType);
        },
        substitute : function (bindings, aType) {
            return substitute(bindings, aType);
        },        
        unify : function (aType1, aType2) {
            return unify(aType1, aType2);
        }
    };
}());
    
    