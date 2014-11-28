/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.typechecker = function (entities) {
    
    'use strict';
    
    var option = require('../Data/option.js').option,
        type = require('../Data/type.js').type,
        ast = require('./ast.js').ast;
    
    function TypeChecker(entities) {
        this.entities = entities;
    }
           
    TypeChecker.prototype.expression = function (environment, expr) {
        switch (type.get(expr)) {
            case 'NumberExpr':
                return option(ast.type.ident('int'));
                
            case 'StringExpr':
                return option(ast.type.ident('string'));
                
            case 'IdentExpr':
                if (environment.hasOwnProperty(expr.value)) {
                    return option(environment[expr.value]);
                } else if (entities.hasOwnProperty(expr.value)) {
                    return option(entities[expr.value]);
                }                
                return option();
                
            default:
                return option();
        }
    };
    
    return new TypeChecker(entities);    
};
    
    