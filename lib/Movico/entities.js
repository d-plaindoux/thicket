/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.entities = function (entities) {
    
    'use strict';
    
    var option = require('../Data/option.js').option,
        type = require('../Data/type.js').type;
    
    function Entities() {
        this.entities = {};
    }
    
    Entities.prototype.declare = function (entity) {
        switch (type.get(entity)) {
            case 'Model':
                this.entities[entity.name] = entity;
                break;
                
            case 'Controller':
                this.entities[entity.name] = entity;
                break;

            case 'View':
                this.entities[entity.name] = entity;
                break;

            default:
                break;
        }

        return this;
    };
    
    Entities.prototype.find = function (name) {
        return option(this.entities[name]);
    };

    function solveEntityVariables(entity) {
        switch (type.get(entity)) {
            case 'Model':
                break;
                
            case 'Controller':
                break;

            case 'View':
                break;

            default:
                break;
        }
    }
    
    Entities.prototype.solveVariables = function () {
        this.entities.forEach(function (entity) {
            solveEntityVariables(entity);
        });
    };
    
    return new Entities(entities);    
};
    
    