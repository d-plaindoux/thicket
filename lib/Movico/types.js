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
    
    function Types() {
        this.varnum = 0;
    }
    
    Types.prototype.newVar = function() {
        this.varnum += 1;        
        return ast.type.variable("#" + this.varnum);
    };
    
    Types.prototype.freeVariables = function(aType) {
        var that = this;
        
        switch (type.get(aType)) {
            case 'TypePolymorphic':
                return this.freeVariables(aType.type).filter(function (name) {
                    return name !== aType.variable;
                });
            case 'TypeVariable':
                return list(aType.name);
            case 'TypeArray':
                return that.freeVariables(aType.type);
            case 'TypeFunction':
                return that.freeVariables(aType.argument).append(that.freeVariables(aType.result));
            case 'TypePair':
                return that.freeVariables(aType.first).append(that.freeVariables(aType.second));
            default:
                return list();
        }
    };
    
    Types.prototype.generalize = function (nongenerics, aType) {
        var freeVariables = this.freeVariables(aType);
        
        if (freeVariables.filter(function (name) { return !nongenerics.contains(name); }).isEmpty()) {
            return aTry.success(aType);
        } 
        
        return aTry.failure(new Error("Type " + aType + " cannot be generalize.")); 
    };
    
    Types.prototype.prune = function(bindings, aType) {
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
    };
    
    Types.prototype.varBind = function (name, aType) {
        var that = this;
        
        switch (type.get(aType)) {
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
        
        switch (type.get(aType)) {
            case 'TypeVariable':
                return bindings.findFirst(function (binding) {
                        return binding._1 === aType.name;
                    }).map(function (binding) {
                        return binding._2;
                    }).orElse(aType);
            case 'TypeArray':
                return ast.type.array(that.substitute(bindings, aType.type));
            case 'TypeFunction':
                return ast.type.abstraction(that.substitute(bindings, aType.argument),
                                            that.substitute(bindings, aType.result));
            case 'TypePair':
                return ast.type.pair(that.substitute(bindings, aType.first),
                                     that.substitute(bindings, aType.second));
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
        
        switch (type.get(aType1)) {
            case 'TypeVariable':
                return that.varBind(aType1.name, aType2);
        } 
        
        switch (type.get(aType2)) {
            case 'TypeVariable':
                return that.varBind(aType2.name, aType1);
        }
        
        switch (type.get(aType1)+"*"+type.get(aType2)) { 
            case 'TypeNative*TypeNative':
                if (aType1.name === aType2.name) {
                    return aTry.success(list());
                }                 
                return aTry.failure(new Error("Cannot unify " + aType1 + " and " + aType2));                
                
            case 'TypeArray*TypeArray':
                return that.unify(aType1.type, aType2.type);
                
            case 'TypeFunction*TypeFunction':
                return that.unify(aType1.argument, aType2.argument).flatmap(function (bindingsArgument) {
                    var aResult1 = that.substitute(bindingsArgument, aType1.result),
                        aResult2 = that.substitute(bindingsArgument, aType2.result);
                    return that.unify(aResult1, aResult2).map(function (bindingsResult) {
                        return that.composeSubstitutions(bindingsArgument, bindingsResult);
                    });
                });
                
            case 'TypePair*TypePair':
                return this.unify(aType1.first, aType2.first).flatmap(function (bindingsFirst) {
                    var aSecond1 = that.substitute(bindingsFirst, aType1.second),
                        aSecond2 = that.substitute(bindingsFirst, aType2.second);
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
    
    