/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var error = require('../exception.js'),
        pair = require('../../../Data/pair.js'),
        option = require('../../../Data/option.js'),
        aTry = require('../../../Data/atry.js'),
        list = require('../../../Data/list.js'),
        ast = require('../syntax/ast.js'),
        symbols = require('../symbols.js'),
        stringify = require('../syntax/stringify.js');    
    
    function Types() {
        this.reset();
    }
    
    Types.prototype.reset = function () {
        this.varnum = 0;
    };

    Types.prototype.newName = function() {
        function toChar(n) {
            return String.fromCharCode(97 + n);
        }
        
        function newName(varnum) {
            var num = varnum, name = "";
            while (num > 25) {
                name = toChar(num%26) + name;
                num  = Math.floor(num/26);
            }
            return toChar(num) + name;
        }
        
        return "'" + newName(this.varnum++);
    };

    Types.prototype.newVar = function() {
        return ast.type.variable(this.newName());
    };
    
    function freeVariables(aType) {
        switch (aType.$t) {
            case symbols.TypePolymorphic:
                return freeVariables(aType.type).minus(list(aType.variables));
            case symbols.TypeSpecialize:
                return freeVariables(aType.type).append(list(aType.parameters).foldL(list(), function (result, parameter) {
                    return result.append(freeVariables(parameter));
                }));
            case symbols.TypeVariable:
                return list(aType.name);
            case symbols.TypeFunction:
                return freeVariables(aType.argument).append(freeVariables(aType.result));
            case symbols.EntitySpecialization:
                return list(aType.parameters).foldL(list(), function (result, parameter) {
                    return result.append(freeVariables(parameter));
                });
            default:
                return list();
        }
    }
    
    Types.prototype.prune = function(bindings, aType) {
        switch (aType.$t) {
            case symbols.TypeVariable:
                return bindings.findFirst(function (binding) {
                        return binding._1 === aType.name;
                    }).map(function (binding) {
                        return binding._2;
                    }).orElse(aType);
            
            default:
                return aType;
        }
    };

    Types.prototype.unfold = function (bindings, environment, aType, visited) {
        var that = this;
                
        switch (aType.$t) {             
            case symbols.TypePolymorphic:
                var newBindings = bindings.foldL(list(), function (bindings, binding) {
                        if (aType.variables.indexOf(binding) === -1) {
                            return bindings.add(binding);
                        }

                        return bindings;
                    });
                
                return that.unfold(newBindings, environment, aType.type, visited).map(function (type) {
                    return ast.type.forall(aType.variables, type); 
                });
                
            case symbols.TypeSpecialize:
                return list(aType.parameters).foldL(aTry.success(list()), function (result, parameter) {
                    return result.flatmap(function (result) {
                        return that.unfold(bindings, environment, parameter, visited).map(function (parameter) {
                            return result.add(parameter);
                        });
                    });
                }).flatmap(function(parameters) {
                    return that.unfold(bindings, environment, aType.type, visited).map(function(aType) {
                        return ast.type.specialize(aType, parameters.value);
                    });
                });
                
            case symbols.EntitySpecialization:
                return list(aType.parameters).foldL(aTry.success(list()), function (result, parameter) {
                    return result.flatmap(function (result) {
                        return that.unfold(bindings, environment, parameter, visited).map(function (parameter) {
                            return result.add(parameter);
                        });
                    });
                }).map(function(parameters) {
                    return ast.specialization(aType.type, parameters.value);
                });

            case symbols.TypeVariable:  
                if (!bindings.contains(aType.name) && aType.namespace) {
                    return environment.getType(aType.namespace, aType.name).flatmap(function (aType) {
                        return that.unfold(bindings, environment, aType, visited);
                    });
                }
                
                return aTry.success(aType);
                
            case symbols.TypeFunction:
                return that.unfold(bindings, environment, aType.argument, visited).flatmap(function (argument) {
                    return that.unfold(bindings, environment, aType.result, visited).map(function (result) {
                        return ast.type.abstraction(argument, result);
                    });
                });

            case symbols.Typedef:
                var newVisited = option.some(visited).orLazyElse(function() { 
                        return list(); 
                    });
                
                if (newVisited.contains(aType.name)) {
                    return aTry.failure(error(aType, "Recursive type definition for " + 
                                              stringify(this.reduce(aType,true).recoverWith(aType))));
                }
                
                return that.unfold(bindings, environment, aType.type, newVisited.add(aType.name));
            
            case symbols.Expression:
                return that.unfold(bindings, environment, aType.type, visited).map(function(unfoldedType) {
                    return ast.expression(aType.name, unfoldedType, aType.expr);
                });

            default:
                return aTry.success(aType);
        }
    };
    
    Types.prototype.varBind = function (name, aType) {
        switch (aType.$t) {
            case symbols.TypeVariable:
                if (aType.name === name) {
                    return aTry.success(list());
                }
        }
        
        if (freeVariables(aType).contains(name)) {
            return aTry.failure(error(aType, 
                                      "Cyclic type dependency " + name + " == " + 
                                      stringify(this.reduce(aType,true).recoverWith(aType)),
                                      true));
        } else {
            return aTry.success(list(pair(name,aType)));
        }
    };
 
    Types.prototype.substitute = function (bindings, aType) {
        if (bindings.isEmpty()) {
            return aType;
        }
        
        var that = this;
        
        switch (aType.$t) {             
            case symbols.TypePolymorphic:
                var newBindings = bindings.foldL(list(), function (bindings, binding) {
                    if (aType.variables.indexOf(binding._1) === -1) {
                        return bindings.add(binding);
                    }
                
                    return bindings;
                });
                
                return ast.type.forall(aType.variables, that.substitute(newBindings, aType.type)); 
            case symbols.TypeSpecialize:
                return ast.type.specialize(that.substitute(bindings,aType.type),
                                           list(aType.parameters).map(function (parameter) {
                    return that.substitute(bindings, parameter);
                }).value);

            case symbols.TypeVariable:
                return bindings.findFirst(function (binding) {
                        return binding._1 === aType.name;
                    }).map(function (binding) {
                        return binding._2;
                    }).orElse(aType);
                
            case symbols.TypeFunction:
                return ast.type.abstraction(that.substitute(bindings, aType.argument),
                                            that.substitute(bindings, aType.result));
                
            case symbols.Expression:
                return ast.expression(aType.name, 
                                      aType.type ? that.substitute(bindings, aType.type) : aType.type,
                                      aType.expr);
                
            case symbols.EntitySpecialization:
                return ast.specialization(aType.type, aType.parameters.map(function (parameter) {
                    return that.substitute(bindings, parameter);
                 }));
                
            case symbols.Model:
                return ast.namespace(ast.model(aType.name, 
                          list(aType.variables).map(function (variable) {
                            return that.substitute(bindings, variable);
                         }).value, 
                         list(aType.params).map(function (param) {
                            return ast.param(param.name, that.substitute(bindings, that.fresh(param.type)));
                         }).value,
                         option.some(aType.parent).map(function (parent) {
                            return that.substitute(bindings, parent);
                         }).orElse(undefined),
                         aType.abstract),
                     aType.namespace);

            case symbols.Trait:
                return ast.namespace(ast.trait(aType.name, 
                          list(aType.variables).map(function (variable) {
                             return that.substitute(bindings, variable);
                          }).value,
                          list(aType.specifications).map(function (specification) {
                             return ast.param(specification.name, that.substitute(bindings, that.fresh(specification.type)));
                          }).value,
                          list(aType.behaviors).map(function(behavior) {
                             return ast.method(behavior.name, 
                                               behavior.definition,
                                               option.some(behavior.caller).map(function (caller) {
                                                  return that.substitute(bindings, that.fresh(caller));
                                               }).orElse(undefined),
                                               option.some(behavior.type).map(function (type) {
                                                  return that.substitute(bindings, that.fresh(type));
                                               }).orElse(undefined));
                          }).value,
                          list(aType.derivations).map(function (derivation) {
                             return that.substitute(bindings, that.fresh(derivation));
                          }).value),
                     aType.namespace);
                
            case symbols.Controller:
                return ast.namespace(ast.controller(aType.name, 
                          list(aType.variables).map(function (variable) {
                             return that.substitute(bindings, variable);
                          }).value,
                          ast.param(aType.param.name, that.substitute(bindings, aType.param.type)), 
                          list(aType.specifications).map(function (specification) {
                             return ast.param(specification.name, that.substitute(bindings, that.fresh(specification.type)));
                          }).value,
                          list(aType.behaviors).map(function(behavior) {
                             return ast.method(behavior.name, 
                                               behavior.definition,
                                               option.some(behavior.caller).map(function (caller) {
                                                  return that.substitute(bindings, that.fresh(caller));
                                               }).orElse(undefined),
                                               option.some(behavior.type).map(function (type) {
                                                  return that.substitute(bindings, that.fresh(type));
                                               }).orElse(undefined));
                          }).value,
                          list(aType.derivations).map(function (derivation) {
                             return that.substitute(bindings, that.fresh(derivation));
                          }).value),
                        aType.namespace);
            
            case symbols.Typedef:
                return ast.typedef(aType.name, list(aType.variables).map(function (variable) {
                    return that.substitute(bindings, variable);
                }).value, that.substitute(bindings, aType.type));
                
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
    
    function depth(aType) {
        switch (aType.$t) {
            case symbols.TypePolymorphic:
            case symbols.TypeSpecialize:
                return 1 + depth(aType.type);
            default:
                return 1;
        }
    }    
    
    Types.prototype._unify_ = function(aType1, aType2, environment) { 
        var that = this, result, bindings;

        // console.log("_>> " + JSON.stringify(aType1) + " ----- <? ----- " + JSON.stringify(aType2));

        switch (aType1.$t) {
            case symbols.TypeVariable:
                if (aType1.namespace) {
                    if (environment) {
                        return environment.getType(aType1.namespace, aType1.name).flatmap(function(aType1) {
                            return that._unify_(aType1, aType2, environment);
                        });
                    }
                } else {
                    return that.varBind(aType1.name, aType2);
                }
        }         
        switch (aType2.$t) {
            case symbols.TypeVariable:
                if (aType2.namespace) {
                    if (environment) { 
                        return environment.getType(aType2.namespace, aType2.name).flatmap(function(aType2) {
                            return that._unify_(aType1, aType2, environment);
                        });
                    }
                }  else {
                    return that.varBind(aType2.name, aType1);
                }
        }

        switch (aType1.$t) {
            case symbols.Typedef:
            case symbols.Expression:
                return that._unify_(aType1.type, aType2, environment);
        }
        switch (aType2.$t) {
            case symbols.Typedef:
            case symbols.Expression:
                return that._unify_(aType1, aType2.type, environment);
        }

        switch (aType1.$t + "*" + aType2.$t) {                                        
            case (symbols.Model + "*" + symbols.Model):
            case (symbols.Trait + "*" + symbols.Trait):
            case (symbols.Controller + "*" + symbols.Controller):
                if (aType1.name === aType2.name && aType1.namespace === aType2.namespace) {
                    return aTry.success(list());
                }            

                break;

            case (symbols.TypePolymorphic + "*" + symbols.TypePolymorphic):
                if (aType1.variables.length === aType2.variables.length) {
                    bindings = list(aType2.variables).zipWith(list(aType1.variables).map(ast.type.variable));
                    return that._unify_(aType1.type, that.substitute(bindings, aType2.type), environment);
                }
                
                break;
                
            case (symbols.TypeNative + "*" + symbols.TypeNative):
                if (aType1.name === aType2.name) {
                    return aTry.success(list());
                }                 
                
                break;
                
            case (symbols.TypeFunction+ "*" + symbols.TypeFunction):
                // Contravariance / Covariance applied
                return that._unify_(aType2.argument, aType1.argument, environment).flatmap(function (bindingsArgument) {
                    var aResult1 = that.substitute(bindingsArgument, aType1.result),
                        aResult2 = that.substitute(bindingsArgument, aType2.result);
                    return that._unify_(aResult1, aResult2, environment).map(function (bindingsResult) {
                        return that.composeSubstitutions(bindingsResult,bindingsArgument);
                    });
                });
                
            case (symbols.EntitySpecialization+ "*" + symbols.EntitySpecialization):
                if (aType1.type.name === aType2.type.name && aType1.type.namespace === aType2.type.namespace) {
                    return list(aType1.parameters).zipWith(list(aType2.parameters)).foldL(aTry.success(list()), function (result, pair) {
                        return result.flatmap(function (result) {
                            var aResult1 = that.substitute(result, pair._1),
                                aResult2 = that.substitute(result, pair._2);
                            return that._unify_(aResult1, aResult2, environment).map(function (substitutions) {
                                return result.append(substitutions);
                            });
                        });
                    });
                }

                break;

            case (symbols.TypeSpecialize+ "*" + symbols.EntitySpecialization):
                if (aType1.type.$t === symbols.TypeVariable) {
                    return list(aType1.parameters).
                    zipWith(list(aType2.parameters)).foldL(aTry.success(list()), function (result, pair) {
                        return result.flatmap(function (result) {
                            var aResult1 = that.substitute(result, pair._1),
                                aResult2 = that.substitute(result, pair._2);
                            return that._unify_(aResult1, aResult2, environment).map(function (substitutions) {
                                return result.append(substitutions);
                            });
                        });
                    }).flatmap(function (result) {
                        return that._unify_(aType1.type, that.generalizeEntity(aType2.type), environment).
                        map(function (substitutions) {
                            return result.append(substitutions);
                        });
                    });
                }

                break;

            case (symbols.EntitySpecialization+ "*" + symbols.TypeSpecialize):
                if (aType2.type.$t === symbols.TypeVariable) {
                    return list(aType1.parameters).
                    zipWith(list(aType2.parameters)).foldL(aTry.success(list()), function (result, pair) {
                        return result.flatmap(function (result) {
                            var aResult1 = that.substitute(result, pair._1),
                                aResult2 = that.substitute(result, pair._2);
                            return that._unify_(aResult1, aResult2, environment).map(function (substitutions) {
                                return result.append(substitutions);
                            });
                        });
                    }).flatmap(function (result) {
                        return that._unify_(that.generalizeEntity(aType1.type), aType2.type, environment).
                        map(function (substitutions) {
                            return result.append(substitutions);
                        });
                    });
                }

                break;
                
            case (symbols.TypeSpecialize+ "*" + symbols.TypeSpecialize):
                if ((aType1.type.$t === symbols.TypeVariable || aType1.type.$t === symbols.TypeNative) &&
                    (aType2.type.$t === symbols.TypeVariable || aType2.type.$t === symbols.TypeNative) &&
                    aType1.parameters.length === aType2.parameters.length) {
                    result = list(aType1.parameters).zipWith(list(aType2.parameters)).foldL(aTry.success(list()), function (result, pair) {
                        return result.flatmap(function (result) {
                            var aResult1 = that.substitute(result, pair._1),
                                aResult2 = that.substitute(result, pair._2);
                            return that._unify_(aResult1, aResult2, environment).map(function (substitutions) {
                                return result.append(substitutions);
                            });
                        });
                    }).flatmap(function (result) {
                        return that._unify_(aType1.type, aType2.type, environment).map(function (substitutions) {
                            return result.append(substitutions);
                        });
                    });
                    
                    if (result.isSuccess()) {
                        return result;
                    }
                }
                
                var depth1 = depth(aType1),
                    depth2 = depth(aType2);
                
                if (depth1 > depth2) {
                    return this.reduce(aType1).flatmap(function (aType1) {
                        return that._unify_(aType1, aType2, environment);
                    });
                } else {
                    return this.reduce(aType2).flatmap(function (aType2) {
                        return that._unify_(aType1, aType2, environment);
                    });                    
                }
                
                break;
        }
        
        switch (aType1.$t) {
            case symbols.TypeSpecialize:                
                return this.reduce(aType1).flatmap(function (aType1) {
                    return that._unify_(aType1, aType2, environment);
                });
                
            case symbols.TypePolymorphic:
                return that._unify_(that.neutralize(aType1), aType2, environment);
                
            case symbols.Model:
                if (option.some(aType1.parent).isPresent()) {
                    result = that._unify_(aType1.parent, aType2, environment);
                    if (result.isSuccess()) {
                        return result;
                    }
                }
                
                break;
                
            case symbols.EntitySpecialization:
                if (that.isModel(aType1.type) && option.some(aType1.type.parent).isPresent()) {
                    result = that._unify_(ast.specialization(aType1.type.parent, aType1.parameters), aType2, environment);
                    if (result.isSuccess()) {
                        return result;
                    }
                }

                break;
        }        

        switch(aType2.$t) {        
            case symbols.TypeSpecialize:
                return this.reduce(aType2).flatmap(function (aType2) {
                    return that._unify_(aType1, aType2, environment);
                });
                
            case symbols.TypePolymorphic:
                return that._unify_(aType1, that.neutralize(aType2), environment);
        }
              
        switch (aType1.$t) {                
            case symbols.EntitySpecialization:
                if (environment && that.isControllerOrTrait(aType1.type)) {
                    bindings = list(aType1.type.variables).map(function(variable) { 
                            return variable.name;
                        }).zipWith(list(aType1.parameters));
                    
                    result = list(aType1.type.derivations).foldL(aTry.failure(new Error()), function(result, derivation) {
                        if (result.isSuccess()) {
                            return result;
                        }

                        return that._unify_(that.substitute(bindings, derivation), aType2, environment);
                    });

                    if (result.isSuccess()) {
                        return result;
                    }
                }

                break;

            case symbols.Trait:
            case symbols.Controller:
                if (environment) {
                    result = list(aType1.derivations).foldL(aTry.failure(new Error()), function(result, derivation) {
                        if (result.isSuccess()) {
                            return result;
                        }

                        return that._unify_(derivation, aType2, environment);
                    });

                    if (result.isSuccess()) {
                        return result;
                    }
                }
                
                break;
        }        
        
        return aTry.failure(
            error(aType1,
                  "Try to use a " + 
                  stringify(this.reduce(aType1,true).recoverWith(aType1)) + 
                  " when waiting for " + 
                  stringify(this.reduce(aType2,true).recoverWith(aType2)))
        );   
    };    

    Types.prototype.unify = function(aType1, aType2, environment) { 

        // console.log("N>> " + stringify(aType1) + " <? " + stringify(aType2));
  
        return this._unify_(aType1, aType2, environment).onSuccess(function() {
            // console.log(" - OK");   
        }).onFailure(function() {
            // console.log(" - KO");   
        });
    };    

    Types.prototype.genericsAndType = function (aType) {
        switch (aType.$t) {
            case symbols.TypePolymorphic:
                return pair(list(aType.variables), aType.type);
            default:
                return pair(list(), aType);
        }
    };
        
    Types.prototype.reduce = function(aType, deep) {
        var that = this;
        
        switch (aType.$t) {
            case symbols.TypeSpecialize:
                var innerType = this.reduce(aType.type,true).recoverWith(aType),
                    genericsAndType = this.genericsAndType(innerType),
                    parameters = list(aType.parameters);
                
                if (genericsAndType._1.size() !== parameters.size()) {
                    return aTry.failure(
                        error(aType.type,
                              "Type " + 
                              stringify(innerType) + 
                              " is waiting for " + 
                              genericsAndType._1.size() + 
                              " parametric type instead of " + 
                              parameters.size())
                    );
                }
                
                if (deep) {
                    var reducedParameters = list(aType.parameters).map(function (parameter) {
                        return that.reduce(parameter, deep).recoverWith(parameter);
                    });

                    return this.reduce(this.substitute(genericsAndType._1.zipWith(reducedParameters), genericsAndType._2), deep);
                }
                
                return aTry.success(this.substitute(genericsAndType._1.zipWith(parameters), genericsAndType._2));
            case symbols.TypeFunction:
                if (deep) {
                    return aTry.success(ast.type.abstraction(this.reduce(aType.argument,deep).recoverWith(aType.argument),
                                                             this.reduce(aType.result,deep).recoverWith(aType.result)));
                }
                return aTry.success(aType);
            case symbols.TypePolymorphic:
                if (deep) {
                    return aTry.success(ast.type.forall(aType.variables,
                                                        this.reduce(aType.type,deep).recoverWith(aType.type)));                    
                }
                return aTry.success(aType);
            default:
                return aTry.success(aType);
        }
    };
    
    Types.prototype.generalizeEntity = function (aType) {
        return ast.type.forall(aType.variables.map(function(variable) { return variable.name; }),
                               ast.specialization(aType, aType.variables));
                                                   
    };
    
    Types.prototype.isModel = function (aType) {
        switch (aType.$t) {
            case symbols.TypePolymorphic:
                return this.isModel(aType.type);                
            case symbols.EntitySpecialization:
                return this.isModel(aType.type);                
            case symbols.Model:
                return true;
            default:
                return false;
        }
    };
    
    Types.prototype.isControllerOrTrait = function (aType) {
        switch (aType.$t) {
            case symbols.TypePolymorphic:
                return this.isControllerOrTrait(aType.type);                
            case symbols.EntitySpecialization:
                return this.isControllerOrTrait(aType.type);                
            case symbols.Controller:
            case symbols.Trait:
                return true;
            default:
                return false;
        }
    };    
    
    Types.prototype.generalize = function (aType) {
        var freeVars = freeVariables(aType).foldL(list(), function(r,v) {
            if (r.contains(v)) {
                return r;
            } else {
                return r.add(v);
            }
        });

        return ast.type.forall(freeVars.value, aType);
    };
    
    Types.prototype.instantiate = function (aType) {
        return this.genericsAndType(this.fresh(aType))._2;
    };
    
    Types.prototype.neutralize = function (aType) {
        var that = this;
        
        switch (aType.$t) {             
            case symbols.TypePolymorphic:
                var genericsAndTypes = that.genericsAndType(aType),
                    substitutions = genericsAndTypes._1.map(function (name) { 
                        return pair(name, ast.type.native(that.newName())); 
                    });
            
                return that.neutralize(that.substitute(substitutions, genericsAndTypes._2));
            default:
                return aType;
        }
    };    
    
    Types.prototype.fresh = function (aType) {
        var that = this,
            genericsAndTypes = that.genericsAndType(aType),
            substitutions = genericsAndTypes._1.map(function (name) { 
                return pair(name, that.newVar()); 
            }),
            instance = that.substitute(substitutions, genericsAndTypes._2);

        return ast.type.forall(substitutions.map(function (p) { return p._2.name; }).value, instance);
    };
    
    return new Types();
}());
    
    