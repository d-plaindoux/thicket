/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.entities = (function () {
    
    'use strict';
    
    var reflect = require('../Data/reflect.js').reflect,
        aTry = require('../Data/atry.js').atry,
        list = require('../Data/list.js').list,
        types = require('./types.js').types,
        expressions = require('./expressions.js').expressions;
    
    function Entities() {
        // Nothing for the moment
    }
    
    Entities.prototype.analyse = function (variables, entity) {
        switch (reflect.typeof(entity)) {
            case 'Model':
                return aTry.failure(new Error("Model"));
            case 'Controller':
                // Define self and this in variables
                return list(entity.behaviors).foldL(aTry.success(entity), function (result, method) {
                    return result.flatmap(function() {
                        var specification = list(entity.specifications).findFirst(function (specification) {
                            return specification.name === method.name;
                        });
                        
                        if (!specification.isPresent()) {
                            return aTry.failure(new Error("Specification not found for " + method.name));
                        }
                        
                        return specification.flatmap(function (specification) {
                            return expressions.analyse(list(entity.generics), variables, method.definition).flatmap(function(variablesAndType) {
                                return types.unify(specification.type, variablesAndType._2).flatmap(function() {
                                    return result;
                                });
                            });                        
                        });
                    });
                });
            case 'View':
                return aTry.failure(new Error("View"));
            default:
                return aTry.failure(new Error("Unsupported entity"));
        }
    };
    
    return new Entities();
}());
    
    