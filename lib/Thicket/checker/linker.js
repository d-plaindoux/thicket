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
        list = require('../../Data/list.js');
    
    function Linker(namespace, environment) {
        this.namespace = namespace;
        this.environment = environment;
    }
    
    function linkType() {
        return aTry.failure(new Error("Not yet implemented"));
    }

    function linkExpression() {
        return aTry.failure(new Error("Not yet implemented"));
    }

    function linkEntity(self, entity) {
        switch (entity.$type) {
            case 'TypePolymorphic':
                return linkEntity(self, entity.type);
                
            case 'Model':
                return list(entity.params).foldL(aTry.success(null), function (result, param) {
                    return result.flatmap(function() {
                        return linkType(param.type);
                    });
                });
                
            case 'Controller':                
                return list(entity.specifications).foldL(aTry.success(null), function (result, specification) {
                    return result.flatmap(function() {
                        return linkType(specification.type);
                    });
                }).flatmap(function(r) {
                    return list(entity.behaviors).foldL(r, function (result, behavior) {
                        return result.flatmap(function() {
                            return linkExpression(behavior.caller);
                        });                        
                    });
                });
                
            case 'Expression':
                return linkExpression(entity.expr).flatmap(function(r) {
                    if (entity.type) {
                        return linkType(entity.type);
                    } else {
                        return r;
                    }
                });
                
            case 'Typedef':
                return linkType(entity.type);      
                
            default:
                return aTry.success(null);
        }
        return entity;
    }
    
    Linker.prototype.link = function(entity) {
        return linkEntity(this, entity);
    };
    
    return function(namespace, environment) {
        return new Linker(namespace, environment);
    };
    
}());