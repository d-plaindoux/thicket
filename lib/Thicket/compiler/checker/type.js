/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
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
        stringify = require('../syntax/stringify.js');    
    
    function Type() {
        this.reset();
    }
    
    Type.prototype.reset = function () {
        this.varnum = 0;
    };

    Type.prototype.newName = function() {
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

    Type.prototype.newVar = function() {
        return ast.type.variable(this.newName());
    };
    
    function freeVariables(aType) {
        switch (aType.$t) {
            case 'TypePolymorphic':
                return freeVariables(aType.type).minus(list(aType.variables));
            case 'TypeSpecialize':
                return freeVariables(aType.type).append(list(aType.parameters).foldL(list(), function (result, parameter) {
                    return result.append(freeVariables(parameter));
                }));
            case 'TypeVariable':
                return list(aType.name);
            case 'TypeFunction':
                return freeVariables(aType.argument).append(freeVariables(aType.result));
            case 'EntitySpecialization':
                return list(aType.parameters).foldL(list(), function (result, parameter) {
                    return result.append(freeVariables(parameter));
                });
            default:
                return list();
        }
    }
    
    Type.prototype.prune = function(bindings, aType) {
        switch (aType.$t) {
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

    Type.prototype.unfold = function (bindings, environment, aType, visited) {
        var that = this;
                
        switch (aType.$t) {             
            case 'TypePolymorphic':
                var newBindings = bindings.foldL(list(), function (bindings, binding) {
                        if (aType.variables.indexOf(binding) === -1) {
                            return bindings.add(binding);
                        }

                        return bindings;
                    });
                
                return that.unfold(newBindings, environment, aType.type, visited).map(function (type) {
                    return ast.type.forall(aType.variables, type); 
                });
                
            case 'TypeSpecialize':
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
                
            case 'EntitySpecialization':
                return list(aType.parameters).foldL(aTry.success(list()), function (result, parameter) {
                    return result.flatmap(function (result) {
                        return that.unfold(bindings, environment, parameter, visited).map(function (parameter) {
                            return result.add(parameter);
                        });
                    });
                }).map(function(parameters) {
                    return ast.specialization(aType.type, parameters.value);
                });

            case 'TypeVariable':  
                if (!bindings.contains(aType.name) && aType.namespace) {
                    return environment.getType(aType.namespace, aType.name).flatmap(function (aType) {
                        return that.unfold(bindings, environment, aType, visited);
                    });
                }
                
                return aTry.success(aType);
                
            case 'TypeFunction':
                return that.unfold(bindings, environment, aType.argument, visited).flatmap(function (argument) {
                    return that.unfold(bindings, environment, aType.result, visited).map(function (result) {
                        return ast.type.abstraction(argument, result);
                    });
                });

            case 'Typedef':
                var newVisited = option.some(visited).orLazyElse(function() { 
                        return list(); 
                    });
                
                if (newVisited.contains(aType.name)) {
                    return aTry.failure(error(aType, "Recursive type definition for " + 
                                              stringify(this.reduce(aType,true).recoverWith(aType))));
                }
                
                return that.unfold(bindings, environment, aType.type, newVisited.add(aType.name));
            
            case 'Expression':
                return that.unfold(bindings, environment, aType.type, visited).map(function(unfoldedType) {
                    return ast.expression(aType.name, unfoldedType, aType.expr);
                });

            default:
                return aTry.success(aType);
        }
    };
    
    Type.prototype.varBind = function (name, aType) {
        switch (aType.$t) {
            case 'TypeVariable':
                if (aType.name === name) {
                    return aTry.success(list());
                }
        }
        
        if (freeVariables(aType).contains(name)) {
            return aTry.failure(error(aType, "Cyclic type dependency " + name + " == " + 
                                      stringify(this.reduce(aType,true).recoverWith(aType))));
        } else {
            return aTry.success(list(pair(name,aType)));
        }
    };
 
    Type.prototype.substitute = function (bindings, aType) {
        if (bindings.isEmpty()) {
            return aType;
        }
        
        var that = this;
        
        switch (aType.$t) {             
            case 'TypePolymorphic':
                var newBindings = bindings.foldL(list(), function (bindings, binding) {
                    if (aType.variables.indexOf(binding._1) === -1) {
                        return bindings.add(binding);
                    }
                
                    return bindings;
                });
                
                return ast.type.forall(aType.variables, that.substitute(newBindings, aType.type)); 
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
                
            case 'Expression':
                return ast.expression(aType.name, 
                                      aType.type ? that.substitute(bindings, aType.type) : aType.type,
                                      aType.expr);
                
            case 'EntitySpecialization':
                return ast.specialization(aType.type, aType.parameters.map(function (parameter) {
                    return that.substitute(bindings, parameter);
                 }));
                
            case 'Model':
                return ast.model(aType.name, 
                      list(aType.variables).map(function (variable) {
                        return that.substitute(bindings, variable);
                     }).value, 
                     list(aType.params).map(function (param) {
                        return ast.param(param.name, that.substitute(bindings, that.fresh(param.type)));
                     }).value,
                     option.some(aType.parent).map(function (parent) {
                        return that.substitute(bindings, parent);
                     }).orElse(undefined),
                     aType.abstract);            

            case 'Trait':
                return ast.trait(aType.name, 
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
                      }).value);

            case 'Controller':
                return ast.controller(aType.name, 
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
                      }).value);
            
            case 'Typedef':
                return ast.typedef(aType.name, list(aType.variables).map(function (variable) {
                    return that.substitute(bindings, variable);
                }).value, that.substitute(bindings, aType.type));
                
            default:
                return aType;
        }
    };
    
    Type.prototype.genericsAndType = function (aType) {
        switch (aType.$t) {
            case 'TypePolymorphic':
                return pair(list(aType.variables), aType.type);
            default:
                return pair(list(), aType);
        }
    };
        
    Type.prototype.reduce = function(aType,deep) {
        var that = this;
        
        switch (aType.$t) {
            case 'TypeSpecialize':
                var genericsAndType = this.genericsAndType(aType.type),
                    parameters = list(aType.parameters);
                
                if (genericsAndType._1.size() !== parameters.size()) {
                    return aTry.failure(
                        error(aType.type,
                              "Type " + 
                              stringify(this.reduce(aType.type,true).recoverWith(aType)) + 
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
            case 'TypeFunction':
                if (deep) {
                    return aTry.success(ast.type.abstraction(this.reduce(aType.argument,deep).recoverWith(aType.argument),
                                                             this.reduce(aType.result,deep).recoverWith(aType.result)));
                }
                return aTry.success(aType);
            case 'TypePolymorphic':
                if (deep) {
                    return aTry.success(ast.type.forall(aType.variables,
                                                        this.reduce(aType.type,deep).recoverWith(aType.type)));                    
                }
                return aTry.success(aType);
            default:
                return aTry.success(aType);
        }
    };
    
    Type.prototype.generalizeEntity = function (aType) {
        return ast.type.forall(aType.variables.map(function(variable) { return variable.name; }),
                               ast.specialization(aType, aType.variables));
                                                   
    };
    
    Type.prototype.generalize = function (aType) {
        var freeVars = freeVariables(aType).foldL(list(), function(r,v) {
            if (r.contains(v)) {
                return r;
            } else {
                return r.add(v);
            }
        });

        return ast.type.forall(freeVars.value, aType);
    };
    
    Type.prototype.instantiate = function (aType) {
        return this.genericsAndType(this.fresh(aType))._2;
    };
    
    Type.prototype.neutralize = function (aType) {
        var that = this;
        
        switch (aType.$t) {             
            case 'TypePolymorphic':
                var genericsAndTypes = that.genericsAndType(aType),
                    substitutions = genericsAndTypes._1.map(function (name) { 
                        return pair(name, ast.type.native(that.newName())); 
                    });
            
                return that.neutralize(that.substitute(substitutions, genericsAndTypes._2));
/*
            case 'TypeSpecialize':
                return ast.type.specialize(
                    aType.type, 
                    aType.parameters.map(function (parameter) {
                        return that._neutralize(parameter);
                    })
                );
       
            case 'EntitySpecialization':
                return ast.specialization(
                    aType.type, 
                    aType.parameters.map(function (parameter) {
                        return that._neutralize(parameter);
                    })
                );

            case 'TypeFunction':
                return ast.type.abstraction(
                    that.neutralize(aType.argument), 
                    that.neutralize(aType.result)
                );
*/
            default:
                return aType;
        }
    };    
    
    Type.prototype.fresh = function (aType) {
        var that = this,
            genericsAndTypes = that.genericsAndType(aType),
            substitutions = genericsAndTypes._1.map(function (name) { 
                return pair(name, that.newVar()); 
            }),
            instance = that.substitute(substitutions, genericsAndTypes._2);

        return ast.type.forall(substitutions.map(function (p) { return p._2.name; }).value, instance);
    };
    
    return new Type();
}());
    
    