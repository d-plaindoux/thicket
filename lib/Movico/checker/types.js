/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var error = require('../exception.js'),
        pair = require('../../Data/pair.js'),
        option = require('../../Data/option.js'),
        aTry = require('../../Data/atry.js'),
        list = require('../../Data/list.js'),
        ast = require('../syntax/ast.js'),
        stringify = require('../syntax/stringify.js');
    
    function Types() {
        this.reset();
    }
    
    Types.prototype.reset = function () {
        this.varnum = 0;
    };
    
    Types.prototype.newVar = function() {
        this.varnum += 1;        
        return ast.type.variable("'" + String.fromCharCode(97 + this.varnum));
    };
    
    Types.prototype.freeVariables = function(aType) {
        var that = this;
        
        switch (aType.$type) {
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
            case 'Typedef':
                return list(aType.variables).foldL(list(), function (result, variable) {
                    return result.append(that.freeVariables(variable));
                });
            default:
                return list();
        }
    };
    
    Types.prototype.prune = function(bindings, aType) {
        switch (aType.$type) {
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
        
        switch (aType.$type) {
            case 'TypeVariable':
                if (aType.name === name) {
                    return aTry.success(list());
                }
        }
        
        if (that.freeVariables(aType).contains(name)) {
            return aTry.failure(error(aType, "Cyclic type dependency " + name + " == " + stringify(aType)));
        } else {
            return aTry.success(list(pair(name,aType)));
        }
    };
    
    Types.prototype.substitute = function (bindings, aType, depth) {
        var that = this;
                
        if (depth === undefined) {
            // must be replaced by recusive type capability later
            depth = true;
        }
        
        if (bindings.isEmpty()) {
            return aType;
        }
        
        switch (aType.$type) {             
            case 'TypePolymorphic':
                var newBindings = bindings.foldL(list(), function (bindings, binding) {
                    if (aType.variables.indexOf(binding._1) === -1) {
                        return bindings.add(binding);
                    }
                
                    return bindings;
                });
                
                return ast.type.forall(aType.variables, that.substitute(newBindings, aType.type, depth)); 
            case 'TypeSpecialize':
                return ast.type.specialize(that.substitute(bindings,aType.type, depth),
                                           list(aType.parameters).map(function (parameter) {
                    return that.substitute(bindings, parameter, depth);
                }).value);

            case 'TypeVariable':
                return bindings.findFirst(function (binding) {
                        return binding._1 === aType.name;
                    }).map(function (binding) {
                        return binding._2;
                    }).orElse(aType);
            case 'TypeFunction':
                return ast.type.abstraction(that.substitute(bindings, aType.argument, depth),
                                            that.substitute(bindings, aType.result, depth));
            case 'Model':
                if (depth) {
                    return ast.model(aType.name, list(aType.variables).map(function (variable) {
                        return that.substitute(bindings, variable, depth);
                    }).value, list(aType.params).map(function (param) {
                                        return ast.param(param.name, that.substitute(bindings, param.type, depth));
                                     }).value,
                                     option.some(aType.parent).map(function (parent) {
                                        return that.substitute(bindings, parent, depth);
                                     }).orElse(undefined));
                }
                
                return aType;

            case 'Controller':
                if (depth) {
                    return ast.controller(aType.name, 
                                          list(aType.variables).map(function (variable) {
                                             return that.substitute(bindings, variable, false);
                                          }).value,
                                          ast.param(aType.param.name, that.substitute(bindings, aType.param.type, false)), 
                                          list(aType.specifications).map(function (specification) {
                                             return ast.param(specification.name, that.substitute(bindings, specification.type, false));
                                          }).value,
                                          list(aType.behaviors).map(function(behavior) {
                                             return ast.method(behavior.name, 
                                                               behavior.definition,
                                                               option.some(behavior.caller).map(function (caller) {
                                                                  return that.substitute(bindings, caller, false);
                                                               }).orElse(undefined));
                                          }).value);
                }
                
                return aType;
                
            case 'View':
                if (depth) {
                    return ast.view(aType.name, 
                                    list(aType.variables).map(function (variable) {
                                       return that.substitute(bindings, variable, false);
                                    }).value,    
                                    ast.param(aType.param.name, that.substitute(bindings, aType.param.type, false)), 
                                    aType.body);
                }
                
                return aType;
                
            case 'Typedef':
                if (depth) {
                    return ast.typedef(aType.name, 
                                       list(aType.variables).map(function (variable) {
                                          return that.substitute(bindings, variable, false);
                                       }).value,    
                                       that.substitute(bindings, aType.type, false));
                }
                
                return aType;
                
            default:
                return aType;
        }
    };
    
    Types.prototype.substituteList = function (substitutions, bindings) {
        var that = this;
        return bindings.map(function (binding) {
            return pair(binding._1, that.substitute(substitutions, binding._2, true));
        });
    };
    
    Types.prototype.composeSubstitutions = function (bindings1,bindings2) {
        var that = this;
        
        return that.substituteList(bindings1, bindings2).append(bindings1);
    };
        
    Types.prototype.unify = function(aType1, aType2) {
        var that = this;
        
        switch (aType1.$type) {
            case 'TypeVariable':
                return that.varBind(aType1.name, aType2);
        } 
        
        switch (aType2.$type) {
            case 'TypeVariable':
                return that.varBind(aType2.name, aType1);
        }

        switch (aType1.$type) {
            case 'Typedef':
                return that.unify(aType1.type, aType2);
        }

        switch (aType2.$type) {
            case 'Typedef':
                return that.unify(aType1, aType2.type);
        }

        switch (aType1.$type) {
            case 'Model':
                if (option.some(aType1.parent).isPresent()) {
                    return that.unify(aType1.parent, aType2);
                }
        }

        switch (aType2.$type) {
            case 'Model':
                if (option.some(aType2.parent).isPresent()) {
                    return that.unify(aType1, aType2.parent);
                }
        }

        switch (aType1.$type) {
            case 'TypePolymorphic':
                return that.unify(that.freshType(aType1).type, aType2);
        }

        switch(aType2.$type) {
            case 'TypePolymorphic':
                return that.unify(aType1, this.freshType(aType2).type);
        }

        switch (aType1.$type) {
            case 'TypeSpecialize':
                return this.reduce(aType1).flatmap(function (aType1) {
                    return that.unify(aType1, aType2);
                });
        }

        switch(aType2.$type) {        
            case 'TypeSpecialize':
                return this.reduce(aType2).flatmap(function (aType2) {
                    return that.unify(aType1, aType2);
                });
        }

        switch (aType1.$type + "*" + aType2.$type) { 
            case 'Model*Model':
            case 'Controller*Controller':
            case 'View*View':
                if (aType1.name !== aType2.name) {
                    return aTry.failure(new Error("Cannot unify " + stringify(aType1) + " and " + stringify(aType2)));                
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
                
                return aTry.failure(new Error("Cannot unify " + stringify(aType1) + " and " + stringify(aType2)));                
                
            case 'TypeFunction*TypeFunction':
                return that.unify(aType1.argument, aType2.argument).flatmap(function (bindingsArgument) {
                    var aResult1 = that.substitute(bindingsArgument, aType1.result),
                        aResult2 = that.substitute(bindingsArgument, aType2.result);
                    return that.unify(aResult1, aResult2).map(function (bindingsResult) {
                        return that.composeSubstitutions(bindingsResult,bindingsArgument);
                    });
                });
                
            default:
                return aTry.failure(new Error("Cannot unify " + stringify(aType1) + " and " + stringify(aType2)));                
        }
    };

    Types.prototype.genericsAndType = function (aType) {
        switch (aType.$type) {
            case 'TypePolymorphic':
                return pair(list(aType.variables), aType.type);
            default:
                return pair(list(), aType);
        }
    };
        
    Types.prototype.reduce = function (aType) {
        switch (aType.$type) {
            case 'TypeSpecialize':
                var genericsAndType = this.genericsAndType(this.freshType(aType.type)),
                    parameters = list(aType.parameters);
                
                if (genericsAndType._1.size() !== parameters.size()) {
                    return aTry.failure(error(aType,
                                              "Type " + aType + " is waiting for " + genericsAndType._1.size() + 
                                              " parametric type instead of " + parameters.size()));
                }
                
                return aTry.success(this.substitute(genericsAndType._1.zipWith(parameters), genericsAndType._2, true));
            default:
                return aTry.success(aType);
        }
    };
    
    Types.prototype.freshType = function (aType) {
        var that = this, substitutions;
        
        switch (aType.$type) {
            case 'TypePolymorphic':
                substitutions = list(aType.variables).map(function (name) { return pair(name,that.newVar()); });

                return ast.type.forall(substitutions.map(function (p) {
                    return p._2.name; // It's a variable
                }).value, this.substitute(substitutions, aType.type, true));
                
            default:
                return aType;
        }
    };
    
    Types.prototype.patternOnly = function (aType) {
        switch (aType.$type) {
            case 'TypePolymorphic':
                return this.patternOnly(aType.type);                
            case 'Model':
                return option.some(aType.parent).isPresent();
            default:
                return false;
        }
    };
    
    Types.prototype.generalize = function (aType) {
        var freeVariables = this.freeVariables(aType).foldL(list(), function(r,v) {
            if (r.contains(v)) {
                return r;
            } else {
                return r.add(v);
            }
        });
        
        return ast.type.forall(freeVariables.value, aType);
    };
    
    return new Types();
}());
    
    