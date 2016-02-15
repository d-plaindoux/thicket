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
        aTry = require('../../../Data/atry.js'),
        list = require('../../../Data/list.js'),
        pair = require('../../../Data/pair.js'),
        symbols = require('../symbols.js'),
        stringify = require('../syntax/stringify.js');
    
    function Linker(packages) {
        this.packages = packages;
    }
    
    function notRetreive(kind, namespace, name) {
        return new Error("No " + kind + " available named " + name, true);
    }

    function notDeclared(namespace, name) {
        return new Error(name + " available in " + namespace + " but missing in the import", true);
    }    
        
    function notFound(namespace) {
        return new Error("Package " + namespace + " not found", true);
    }    

    Linker.prototype.findTypeInImports = function(aPackage, namespace ,name, allowed) {
        var self = this;

        return aPackage.imports().foldL(aTry.failure(notRetreive("type", namespace, name)), function(result, anImport) {
            if (result.isSuccess()) {
                return result;
            }             

            if (anImport.names) {
                return self.packages.retrieve(anImport.namespace).map(function(aPackage) {
                    if (aPackage.containsType(name, allowed)) {
                        if (anImport.names.length === 0 || anImport.names.indexOf(name) !== -1) {
                            return aTry.success(anImport.namespace);
                        }

                        return aTry.failure(notDeclared(anImport.namespace, name));
                    }

                    return result;
                }).orElse(result);
            }
            
            return self.findTypeNamespace(anImport.namespace, name, allowed);   
        });            
    };

    Linker.prototype.findExpressionInImports = function(aPackage, namespace ,name) {
        var self = this;
        
        return aPackage.imports().foldL(aTry.failure(notRetreive("expression", namespace, name)), function(result, anImport) {
            if (result.isSuccess()) {
                return result;
            }             
            
            if (anImport.names) {
                return self.packages.retrieve(anImport.namespace).map(function(aPackage) {
                    if (aPackage.containsExpression(name)) {
                        if (anImport.names.length === 0 || anImport.names.indexOf(name) !== -1) {
                            return aTry.success(anImport.namespace);
                        }

                        return aTry.failure(notDeclared(anImport.namespace, name));
                    }

                    return result;
                }).orElse(result);
            }

            return self.findExpressionNamespace(anImport.namespace, name);   
        });            
    };

    Linker.prototype.findTypeNamespace = function(namespace, name, allowed) {
        var self = this;

        return self.packages.retrieve(namespace).map(function (aPackage) {
            if (aPackage.containsType(name, allowed)) {                
                return aTry.success(namespace);
            }
                        
            return self.findTypeInImports(aPackage, namespace, name, allowed);    
        }).orLazyElse(function () { 
            return aTry.failure(notRetreive("type", namespace, name));
        });     
    };
    
    Linker.prototype.findExpressionNamespace = function(namespace, name) {
        var self = this;
        
        return self.packages.retrieve(namespace).map(function (aPackage) {
            if (aPackage.containsExpression(name)) {
                
                return aTry.success(namespace);
            }
                        
            return self.findExpressionInImports(aPackage, namespace, name);    
        }).orLazyElse(function () { 
            return aTry.failure(notRetreive("expression", namespace, name));
        });     
    };
    
    Linker.prototype.linkType = function(namespace, aType, variables, allowed) {    
        var self = this;
        
        switch (aType.$t) {
            case symbols.TypePolymorphic:
                return self.linkType(namespace, aType.type, variables.append(list(aType.variables)), allowed);
                
            case symbols.TypeVariable:
                if (aType.namespace) {
                    if (self.packages.retrieve(aType.namespace).isPresent()) {
                        return self.packages.retrieve(aType.namespace).get().
                                    findType(aType.name).
                                    map(function () {
                            return list([pair(aType.namespace, aType.value)]);
                        });
                    }
                    
                    return aTry.failure(error(aType, "Unknown module " + aType.namespace));
                }

                if (variables.contains(aType.name)) {
                    return aTry.success(list());
                }

                return self.findTypeNamespace(namespace, aType.name, allowed).flatmap(function (namespace) {
                    return self.packages.retrieve(namespace).get().findType(aType.name, allowed).map(function() {
                        aType.namespace = namespace;
                        return list([pair(aType.namespace, aType.name)]);
                    });
                }); 
                
            case symbols.TypeSpecialize:
                return self.linkType(namespace, aType.type, variables, allowed).flatmap(function(result) {
                    return list(aType.parameters).foldL(aTry.success(result), function(result, parameter) {
                        return result.flatmap(function(result) {
                            return self.linkType(namespace, parameter, variables, allowed).map(function(links) {
                                return result.append(links);
                            });
                        });
                    });                   
                });
                
            case symbols.TypeFunction:
                return self.linkType(namespace, aType.argument, variables, allowed).flatmap(function(result) {
                    return self.linkType(namespace, aType.result, variables, allowed).map(function(links) {
                        return result.append(links);
                    });
                });
                
            default:
                return aTry.failure(error(aType,"Cannot link " + stringify(aType) + " in " + namespace));
        }        
    };

    Linker.prototype.linkExpression = function(namespace, expression, variables, typeVariables) {
        var self = this;
        
        switch (expression.$t) {
            case symbols.NativeExpr:
                return aTry.success(list());
                
            case symbols.IdentExpr:
                if (expression.namespace) {
                    if (self.packages.retrieve(expression.namespace).isPresent()) {
                        return self.packages.retrieve(expression.namespace).get().
                                    findExpression(expression.value).
                                    map(function () {
                            return list([pair(expression.namespace, expression.value)]);
                        });
                    }
                    
                    return aTry.failure(error(expression, "Unknown module " + expression.namespace));
                }
                
                if (variables.contains(expression.value)) {
                    return aTry.success(list());
                }
                
                return self.findExpressionNamespace(namespace, expression.value).flatmap(function (namespace) {
                    return self.packages.retrieve(namespace).get().findExpression(expression.value).map(function() {
                        expression.namespace = namespace;
                        return list([pair(expression.namespace, expression.value)]);
                    });
                });
                
            case symbols.InvokeExpr:
                return self.linkExpression(namespace, expression.caller, variables, typeVariables);   
                
            case symbols.ApplicationExpr:
                var links = self.linkExpression(namespace, expression.argument, variables, typeVariables);
                return self.linkExpression(namespace, expression.abstraction, variables, typeVariables).map(function(result) {
                    return result.append(links.recoverWith(list()));
                });                
                
            case symbols.LetExpr:
                return self.linkExpression(namespace, expression.value, variables, typeVariables).flatmap(function() {
                    return self.linkExpression(namespace, expression.body, variables.add(expression.name));
                }).flatmap(function(result) {
                    if (expression.type) {
                        return self.linkType(namespace, expression.type, list(), {}).map(function(links) {
                            return result.append(links);
                        });
                    }                    
                    return aTry.success(result);
                });
                
            case symbols.AbstractionExpr:
                return self.linkExpression(namespace, expression.body, variables.add(expression.param)).flatmap(function(result) {
                    if (expression.type) {
                        return self.linkType(namespace, expression.type, list(), {}).map(function(links) {
                            return result.append(links);
                        });
                    }                    
                    return aTry.success(result);
                });
                
            case symbols.NewModelExpr:
                return self.linkExpression(namespace, expression.model, variables, typeVariables).flatmap(function(result) {
                    return list(expression.alter).foldL(aTry.success(result), function(result, alter) {
                        return result.flatmap(function(result) {
                            return self.linkExpression(namespace, alter[1], variables, typeVariables).map(function(links) {
                                return result.append(links);
                            });
                        });
                    });
                });
                
            default:
                return aTry.failure("Cannot link " + expression.$t + " in " + namespace);
        }
    };
    
    Linker.prototype.linkEntity = function(namespace, entity, variables) {
        var self = this;
        
        switch (entity.$t) {
            case symbols.TypePolymorphic:
                return self.linkEntity(namespace, entity.type, variables.append(list(entity.variables)));
                
            case symbols.EntitySpecialization:
                return self.linkEntity(namespace, entity.type, variables);
                
            case symbols.Model:
                return list(entity.params).foldL(aTry.success(list()), function (result, param) {
                    return result.flatmap(function(result) {
                        return self.linkType(namespace, param.type, variables, {}).map(function(links) {
                            return result.append(links);
                        });
                    });
                }).flatmap(function(result) {
                    if (entity.parent) {
                        return self.linkEntity(namespace, entity.parent, variables).map(function(links) {
                            return result.append(links);
                        });
                    }                    
                    return aTry.success(result);
                });
                
            case symbols.Trait: 
                return list(entity.specifications).foldL(aTry.success(list()), function (result, specification) {
                    return result.flatmap(function(result) {
                        return self.linkType(namespace, specification.type, variables, {}).map(function(links) {
                            return result.append(links);
                        });
                    });
                }).flatmap(function(result) {
                    return list(entity.derivations).foldL(aTry.success(result), function (result, derivation) {
                        return result.flatmap(function(result) {
                            return self.linkType(namespace, derivation, variables, {}).map(function(links) {
                                return result.append(links);
                            });
                        });
                    });
                }).flatmap(function(result) {
                    return list(entity.behaviors).foldL(aTry.success(result), function (result, behavior) {
                        return result.flatmap(function(result) {
                            if (behavior.type) {
                                return self.linkType(namespace, behavior.type, variables, {}).map(function(links) {
                                    return result.append(links);
                                });
                            }
                            
                            return aTry.success(result);
                        });
                    });
                }).flatmap(function(result) {
                    return list(entity.behaviors).foldL(aTry.success(result), function (result, behavior) {
                        return result.flatmap(function(result) {                            
                            return self.linkExpression(namespace, behavior.definition, list("self"), variables).map(function(links) {
                                return result.append(links);
                            });
                        });
                    });
                });

            case symbols.Controller:                
                return list(entity.specifications).foldL(aTry.success(list()), function (result, specification) {
                    return result.flatmap(function(result) {
                        return self.linkType(namespace, specification.type, variables, {}).map(function(links) {
                            return result.append(links);
                        });
                    });
                }).flatmap(function(result) {
                    return list(entity.behaviors).foldL(aTry.success(result), function (result, behavior) {
                        return result.flatmap(function(result) {
                            if (behavior.type) {
                                return self.linkType(namespace, behavior.type, variables, {}).map(function(links) {
                                    return result.append(links);
                                });
                            }
                            
                            return aTry.success(result);
                        });
                    });
                }).flatmap(function(result) {
                    return list(entity.derivations).foldL(aTry.success(result), function (result, derivation) {
                        return result.flatmap(function(result) {
                            return self.linkType(namespace, derivation, variables, {}).map(function(links) {
                                return result.append(links);
                            });
                        });
                    });
                }).flatmap(function(result) {
                    return list(entity.behaviors).foldL(aTry.success(result), function (result, behavior) {
                        return result.flatmap(function(result) {                            
                            return self.linkExpression(namespace, behavior.definition, list("self", entity.param.name), variables).map(function(links) {
                                return result.append(links);
                            });
                        }).flatmap(function(result) {
                            if (behavior.caller) {
                                return self.linkType(namespace, behavior.caller, variables, {models:true}).map(function(links) {
                                    return result.append(links);
                                });
                            }                             
                            return aTry.success(result);
                        });
                    });
                }).flatmap(function(result) {
                    return self.linkType(namespace, entity.param.type, variables, {}).map(function(links) {
                        return result.append(links);
                    });
                });
                                
            case symbols.Expression:
                return self.linkExpression(namespace, entity.expr, list(), variables).flatmap(function(result) {
                    if (entity.type) {
                        return self.linkType(namespace, entity.type, variables, {}).map(function(links) {
                            return result.append(links);
                        });
                    }                    
                    return aTry.success(result);
                });
                    
            case symbols.Typedef:
                return self.linkType(namespace, entity.type, variables, {});      
                
            default:
                return aTry.failure("Cannot link " + entity.$t + " in " + namespace);
        }
    };
    
    Linker.prototype.linkEntities = function(namespace, entities) { 
        var self = this;
        
        return entities.foldL(aTry.success(list()), function (result, entity) {
            return result.flatmap(function(result) {
                return self.linkEntity(namespace, entity.definition, list()).map(function(links) {
                    return result.append(links);
                });
            });
        }).map(function(result) {
            return result.foldR(function(pair,result) {
                if (result.filter(function (p) { return p._1 === pair._1 && p._2 === pair._2; }).isEmpty()) {
                    return result.add(pair);
                }
                
                return result;
            }, list());
        });
    };

    Linker.prototype.linkSentence = function(namespace, sentence) {
        return this.linkExpression(namespace, sentence, list(), list());
    };
    
    Linker.prototype.linkSentences = function(namespace, sentences) { 
        var self = this;
        
        return sentences.foldL(aTry.success(list()), function (result, sentence) {
            return result.flatmap(function(result) {
                return self.linkSentence(namespace, sentence.definition).map(function(links) {
                    return result.append(links);
                });
            });
        });
    };
    
    Linker.prototype.linkPackage = function(aPackage) { 
        var self = this;
        
        return self.linkEntities(aPackage.namespace(), aPackage.entities()).flatmap(function() {
            return self.linkSentences(aPackage.namespace(), aPackage.sentences());
        });
    };

    Linker.prototype.linkPackageByName = function(namespace) { 
        var self = this;
        
        return self.packages.retrieve(namespace).map(function(aPackage) {
            return self.linkPackage(aPackage);
        }).orLazyElse(function() {
            return aTry.failure(notFound(namespace));
        });
    };
    
    return function(packages) {
        return new Linker(packages);
    };
    
}());