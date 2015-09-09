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
        switch (aType.$type) {
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

    Types.prototype.unfold = function (bindings, environment, aType, visited) {
        var that = this;
                
        switch (aType.$type) {             
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
                    return that.unfold(bindings, environment, aType.type, visited).map(function (type) {
                        return ast.type.specialize(type, parameters.value);
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
                return that.unfold(bindings, environment, aType.argument).flatmap(function (argument) {
                    return that.unfold(bindings, environment, aType.result, visited).map(function (result) {
                        return ast.type.abstraction(argument, result);
                    });
                });

            case 'Typedef':
                var newVisited = option.some(visited).orLazyElse(function() { 
                        return list(); 
                    });
                
                if (newVisited.contains(aType.name)) {
                    return aTry.failure(error(aType, "Recursive type definition for " + stringify(this.reduce(aType,true).recoverWith(aType))));
                }
                
                return that.unfold(bindings, environment, aType.type, newVisited.add(aType.name));
            
            default:
                return aTry.success(aType);
        }
    };
    
    Types.prototype.varBind = function (name, aType) {
        switch (aType.$type) {
            case 'TypeVariable':
                if (aType.name === name) {
                    return aTry.success(list());
                }
        }
        
        if (freeVariables(aType).contains(name)) {
            return aTry.failure(error(aType, "Cyclic type dependency " + name + " == " + stringify(this.reduce(aType,true).recoverWith(aType))));
        } else {
            return aTry.success(list(pair(name,aType)));
        }
    };
    
    Types.prototype.substitute = function (bindings, aType) {
        if (bindings.isEmpty()) {
            return aType;
        }
        
        var that = this;
        
        switch (aType.$type) {             
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
        switch (aType.$type) {
            case 'TypePolymorphic':
            case 'TypeSpecialize':
                return 1 + depth(aType.type);
            default:
                return 1;
        }
    }    
    
    Types.prototype.unify = function(aType1, aType2) { 
        var that = this;
/*        
        console.log("N>> " + stringify(this.reduce(aType1).recoverWith(aType1)) + 
                    " ?= " + stringify(this.reduce(aType2).recoverWith(aType2)));

        console.log("R>> " + aType1.$type + " ?= " + aType2.$type);
*/        
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
            case 'Expression':
                return that.unify(aType1.type, aType2);
        }
        switch (aType2.$type) {
            case 'Typedef':
            case 'Expression':
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
            case 'EntitySpecialization':
                if (that.isModel(aType1.type) && option.some(aType1.type.parent).isPresent()) {
                    return that.unify(ast.specialization(aType1.type.parent, aType1.parameters), aType2);
                }
        }
        switch (aType2.$type) {
            case 'EntitySpecialization':
                if (that.isModel(aType2.type) && option.some(aType2.type.parent).isPresent()) {
                    return that.unify(aType2, ast.specialization(aType2.type.parent, aType2.parameters));
                }
        }

        switch (aType1.$type + "*" + aType2.$type) {                                        
            case 'Model*Model':
            case 'Trait*Trait':
            case 'Controller*Controller':
                if (aType1.name !== aType2.name) {
                    return aTry.failure(error(aType1, 
                                              "Cannot unify " + 
                                              stringify(this.reduce(aType1,true).recoverWith(aType1)) + 
                                              " and " + 
                                              stringify(this.reduce(aType2,true).recoverWith(aType2))));   
                }            
                
                return aTry.success(list());
                
            case 'TypeNative*TypeNative':
                if (aType1.name === aType2.name) {
                    return aTry.success(list());
                }                 
                
                return aTry.failure(error(aType1, 
                                          "Cannot unify " + 
                                          stringify(this.reduce(aType1,true).recoverWith(aType1)) + 
                                          " and " + 
                                          stringify(this.reduce(aType2,true).recoverWith(aType2))));   
                
            case 'TypeFunction*TypeFunction':
                return that.unify(aType1.argument, aType2.argument).flatmap(function (bindingsArgument) {
                    var aResult1 = that.substitute(bindingsArgument, aType1.result),
                        aResult2 = that.substitute(bindingsArgument, aType2.result);
                    return that.unify(aResult1, aResult2).map(function (bindingsResult) {
                        return that.composeSubstitutions(bindingsResult,bindingsArgument);
                    });
                });
                
            case 'EntitySpecialization*EntitySpecialization':
                if (aType1.type.name !== aType2.type.name) {
                    return aTry.failure(error(aType1, 
                                              "Cannot unify " + 
                                              stringify(this.reduce(aType1,true).recoverWith(aType1)) + 
                                              " and " + 
                                              stringify(this.reduce(aType2,true).recoverWith(aType2))));   
                }

                return list(aType1.parameters).zipWith(list(aType2.parameters)).foldL(aTry.success(list()), function (result, pair) {
                    return result.flatmap(function (result) {
                        var aResult1 = that.substitute(result, pair._1),
                            aResult2 = that.substitute(result, pair._2);
                        return that.unify(aResult1, aResult2).map(function (substitutions) {
                            return result.append(substitutions);
                        });
                    });
                });

            case 'TypeSpecialize*EntitySpecialization':
                if (aType1.type.$type === 'TypeVariable') {
                    return list(aType1.parameters).zipWith(list(aType2.parameters)).foldL(aTry.success(list()), function (result, pair) {
                        return result.flatmap(function (result) {
                            var aResult1 = that.substitute(result, pair._1),
                                aResult2 = that.substitute(result, pair._2);
                            return that.unify(aResult1, aResult2).map(function (substitutions) {
                                return result.append(substitutions);
                            });
                        });
                    }).flatmap(function (result) {
                        return that.unify(aType1.type, that.generalizeEntity(aType2.type)).map(function (substitutions) {
                            return result.append(substitutions);
                        });
                    });
                }

                return this.reduce(aType1).flatmap(function (aType1) {
                    return that.unify(aType1, aType2);
                });

            case 'EntitySpecialization*TypeSpecialize':
                if (aType2.type.$type === 'TypeVariable') {
                    return list(aType1.parameters).zipWith(list(aType2.parameters)).foldL(aTry.success(list()), function (result, pair) {
                        return result.flatmap(function (result) {
                            var aResult1 = that.substitute(result, pair._1),
                                aResult2 = that.substitute(result, pair._2);
                            return that.unify(aResult1, aResult2).map(function (substitutions) {
                                return result.append(substitutions);
                            });
                        });
                    }).flatmap(function (result) {
                        return that.unify(that.generalizeEntity(aType1.type), aType2.type).map(function (substitutions) {
                            return result.append(substitutions);
                        });
                    });
                }

                return this.reduce(aType2).flatmap(function (aType2) {
                    return that.unify(aType1, aType2);
                });
                
            case 'TypeSpecialize*TypeSpecialize':
                if (aType1.type.$type === 'TypeVariable' || aType2.type.$type === 'TypeVariable') {
                    return list(aType1.parameters).zipWith(list(aType2.parameters)).foldL(aTry.success(list()), function (result, pair) {
                        return result.flatmap(function (result) {
                            var aResult1 = that.substitute(result, pair._1),
                                aResult2 = that.substitute(result, pair._2);
                            return that.unify(aResult1, aResult2).map(function (substitutions) {
                                return result.append(substitutions);
                            });
                        });
                    }).flatmap(function (result) {
                        return that.unify(aType1.type, aType2.type).map(function (substitutions) {
                            return result.append(substitutions);
                        });
                    });
                }
                
                var depth1 = depth(aType1),
                    depth2 = depth(aType2);
                
                if (depth1 > depth2) {
                    return this.reduce(aType1).flatmap(function (aType1) {
                        return that.unify(aType1, aType2);
                    });
                } else {
                    return this.reduce(aType2).flatmap(function (aType2) {
                        return that.unify(aType1, aType2);
                    });                    
                }
                
                break;
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
        
        switch (aType1.$type) {
            case 'TypePolymorphic':
                return that.unify(that.instantiate(aType1), aType2);
        }        
        switch (aType2.$type) {
            case 'TypePolymorphic':
                return that.unify(aType1, that.neutralize(aType2));
        }


        return aTry.failure(error(aType1,
                                  "Cannot unify " + 
                                  stringify(this.reduce(aType1,true).recoverWith(aType1)) + 
                                  " and " + 
                                  stringify(this.reduce(aType2,true).recoverWith(aType2))));   
    };    

    Types.prototype.genericsAndType = function (aType) {
        switch (aType.$type) {
            case 'TypePolymorphic':
                return pair(list(aType.variables), aType.type);
            default:
                return pair(list(), aType);
        }
    };
        
    Types.prototype.reduce = function(aType,deep) {
        var that = this;
        
        switch (aType.$type) {
            case 'TypeSpecialize':
                var genericsAndType = this.genericsAndType(aType.type),
                    parameters = list(aType.parameters);
                
                if (genericsAndType._1.size() !== parameters.size()) {
                    return aTry.failure(error(aType.type,
                                              "Type " + 
                                              stringify(this.reduce(aType.type,true).recoverWith(aType)) + 
                                              " is waiting for " + 
                                              genericsAndType._1.size() + 
                                              " parametric type instead of " + 
                                              parameters.size()));
                }
                
                if (deep) {
                    var reducedParameters = list(aType.parameters).map(function (parameter) {
                        return that.reduce(parameter, deep).recoverWith(parameter);
                    });

                    return this.reduce(this.substitute(genericsAndType._1.zipWith(reducedParameters), genericsAndType._2),deep);
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
    
    Types.prototype.generalizeEntity = function (aType) {
        return ast.type.forall(aType.variables.map(function(variable) { return variable.name; }),
                               ast.specialization(aType, aType.variables));
                                                   
    };
    
    Types.prototype.isModel = function (aType) {
        switch (aType.$type) {
            case 'TypePolymorphic':
                return this.isModel(aType.type);                
            case 'EntitySpecialization':
                return this.isModel(aType.type);                
            case 'Model':
                return option.some(aType.parent).isPresent();
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
        var that = this,
            genericsAndTypes = that.genericsAndType(aType),
            substitutions = genericsAndTypes._1.map(function (name) { 
                return pair(name, ast.type.native(that.newName())); 
            });
            
        return that.substitute(substitutions, genericsAndTypes._2);
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
    
    