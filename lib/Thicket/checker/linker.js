/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var aTry = require('../../Data/atry.js'),
        list = require('../../Data/list.js'),
        stringify = require('../syntax/stringify.js');
    
    function Linker(packages) {
        this.packages = packages;
    }
    
    function notRetreive(kind, namespace, name) {
        return new Error("No " + kind + " available named " + name + " in " + namespace);
    }

    function notDeclared(namespace, name) {
        return new Error(name + " available in " + namespace + " but missing in the import");
    }    
        
    function notFound(namespace) {
        return new Error("Package " + namespace + " not found");
    }    
        
    Linker.prototype.findInImports = function(aPackage, namespace ,name) {
        var self = this;

        return aPackage.imports().foldL(aTry.failure(notRetreive("entity", namespace, name)), function(result, anImport) {
            if (result.isSuccess()) {
                return result;
            }             

            return self.packages.retrieve(anImport.namespace).map(function(aPackage) {
                if (aPackage.inNamespace(name)) {
                    if (anImport.names.length === 0 || anImport.names.indexOf(name) !== -1) {
                        return aTry.success(anImport.namespace);
                    }

                    return aTry.failure(notDeclared(anImport.namespace, name));
                }

                return result;
            }).orElse(result);
        });            
    };

    Linker.prototype.findNamespace = function(namespace, name) {
        var self = this;
        
        return self.packages.retrieve(namespace).map(function (aPackage) {
            if (aPackage.inNamespace(name)) {
                return aTry.success(namespace);
            }
                        
            return self.findInImports(aPackage, namespace, name);    
        }).orLazyElse(function () { 
            return aTry.failure(notRetreive("entity", namespace, name));
        });     
    };
    
    Linker.prototype.linkType = function(namespace, aType, variables) {
                
        var self = this;
        
        switch (aType.$type) {
            case 'TypePolymorphic':
                return self.linkType(namespace, aType.type, variables.append(list(aType.variables)));
                
            case 'TypeVariable':
                if (variables.contains(aType.name)) {
                    return aTry.success(null);
                }

                return self.findNamespace(namespace, aType.name).flatmap(function (namespace) {
                    return self.packages.retrieve(namespace).get().findType(aType.name).map(function() {
                        aType.namespace = namespace;
                        return null;
                    });
                }); 
                
            case 'TypeSpecialize':
                return self.linkType(namespace, aType.type, variables).flatmap(function(result) {
                    return list(aType.parameters).foldL(aTry.success(result), function(result, parameter) {
                        return result.flatmap(function() {
                            return self.linkType(namespace, parameter, variables);
                        });
                    });                   
                });
                
            case 'TypeFunction':
                return self.linkType(namespace, aType.argument, variables).flatmap(function() {
                    return self.linkType(namespace, aType.result, variables);
                });
                
            default:
                return aTry.failure("Cannot link " + stringify(aType) + " in " + namespace);
        }        
    };

    Linker.prototype.linkExpression = function(namespace, expression, variables, typeVariables) {
        var self = this;
        
        switch (expression.$type) {
            case 'NumberExpr':
            case 'StringExpr':
            case 'UnitExpr':
                return aTry.success(null);
                
            case 'IdentExpr':
                if (variables.contains(expression.value)) {
                    return aTry.success(null);
                }

                return self.findNamespace(namespace, expression.value).flatmap(function (namespace) {
                    return self.packages.retrieve(namespace).get().findExpression(expression.value).map(function() {
                        expression.namespace = namespace;
                        return null;
                    });
                });
                
            case 'InvokeExpr':
                return self.linkExpression(namespace, expression.caller, variables, typeVariables);   
                
            case 'PairExpr':
                return self.linkExpression(namespace, expression.left, variables, typeVariables).flatmap(function() {
                    return self.linkExpression(namespace, expression.right, variables, typeVariables);
                });
                
            case 'ApplicationExpr':
                return self.linkExpression(namespace, expression.abstraction, variables, typeVariables).map(function(result) {
                    self.linkExpression(namespace, expression.argument, variables, typeVariables);
                    return result;
                });                
                
            case 'ComprehensionExpr':
                return list(expression.iterations).foldL(aTry.success(variables), function(result, iteration) {
                    return result.flatmap(function(variables) {
                        return self.linkExpression(namespace, iteration[1], variables, typeVariables).map(function() {
                            return variables.add(iteration[0]);
                        });
                    });
                }).flatmap(function (variables) {
                    return list(expression.conditions).foldL(aTry.success(variables), function(result, condition) {
                        return result.flatmap(function(variables) {
                            return self.linkExpression(namespace, condition, variables, typeVariables).map(function() {
                                return variables;
                            });
                        });
                    });
                }).flatmap(function (variables) {
                    return self.linkExpression(namespace, expression.value, variables, typeVariables);
                });
                
            case 'TagExpr':
                return list(expression.attributes).foldL(aTry.success(null), function(result, attribute) {
                    return result.flatmap(function() {
                        return self.linkExpression(namespace, attribute[1], variables, typeVariables);
                    });
                }).flatmap(function(result) {
                    return list(expression.body).foldL(aTry.success(result), function(result, body) {
                        return result.flatmap(function() {
                            return self.linkExpression(namespace, body, variables, typeVariables);
                        });
                    });
                });
                
            case 'LetExpr':
                return self.linkExpression(namespace, expression.value, variables, typeVariables).flatmap(function() {
                    return self.linkExpression(namespace, expression.body, variables.add(expression.name));
                }).flatmap(function(result) {
                    if (expression.type) {
                        return self.linkType(namespace, expression.type, list());
                    }
                    
                    return aTry.success(result);
                });
                
            case 'AbstractionExpr':
                return self.linkExpression(namespace, expression.body, variables.add(expression.param)).flatmap(function(result) {
                    if (expression.type) {
                        return self.linkType(namespace, expression.type, list());
                    }
                    
                    return aTry.success(result);
                });
                
            case 'NewModelExpr':
                return self.linkExpression(namespace, expression.model, variables, typeVariables).flatmap(function(result) {
                    return list(expression.alter).foldL(aTry.success(result), function(result, alter) {
                        return result.flatmap(function() {
                            return self.linkExpression(namespace, alter[1], variables, typeVariables);
                        });
                    });
                });
                
            default:
                return aTry.failure("Cannot link " + expression.$type + " in " + namespace);
        }
    };

    Linker.prototype.linkEntity = function(namespace, entity, variables) {
        var self = this;

        switch (entity.$type) {
            case 'TypePolymorphic':
                return self.linkEntity(namespace, entity.type, variables.append(list(entity.variables)));
                
            case 'Model':
                return list(entity.params).foldL(aTry.success(null), function (result, param) {
                    return result.flatmap(function() {
                        return self.linkType(namespace, param.type, variables);
                    });
                }).flatmap(function(result) {
                    if (entity.parent) {
                        return self.linkEntity(namespace, entity.parent, variables);
                    }
                    
                    return aTry.success(result);
                });
                
            case 'Controller':                
                return list(entity.specifications).foldL(aTry.success(null), function (result, specification) {
                    return result.flatmap(function() {
                        return self.linkType(namespace, specification.type, variables);
                    });
                }).flatmap(function(r) {
                    return list(entity.behaviors).foldL(aTry.success(r), function (result, behavior) {
                        return result.flatmap(function() {
                            return self.linkExpression(namespace, behavior.definition, list("self", entity.param.name), variables);
                        });                        
                    });
                });
                
            case 'Expression':
                return self.linkExpression(namespace, entity.expr, list(), variables).flatmap(function(r) {
                    if (entity.type) {
                        return self.linkType(namespace, entity.type, variables);
                    } else {
                        return aTry.success(r);
                    }
                });
                
            case 'Typedef':
                return self.linkType(namespace, entity.type, variables);      
                
            default:
                return aTry.failure("Cannot link " + entity.$type + " in " + namespace);
        }
    };
    
    Linker.prototype.linkEntities = function(namespace, entities) { 
        var self = this;
        
        return entities.foldL(aTry.success(null), function (result, entity) {
            return result.flatmap(function() {
                return self.linkEntity(namespace, entity.definition, list());
            });
        });           
    };

    Linker.prototype.linkPackage = function(aPackage) { 
        var self = this;
        
        return self.linkEntities(aPackage.namespace(), aPackage.entities());
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