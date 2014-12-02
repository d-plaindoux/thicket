/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.entities = (function () {
    
    'use strict';
    
    var option = require('../Data/option.js').option,
        type = require('../Data/type.js').type;
    
    function Entities() {
        this.entities = {};
    }
    
    Entities.prototype.solveModel = function () {
        // Nothing to do for the moment
    };
    
    Entities.prototype.solveController = function () {
        // Nothing to do for the moment
    };
    
    Entities.prototype.solveView = function () {
        // Nothing to do for the moment        
    };
    
    Entities.prototype.declare = function (entity) {
        switch (type.get(entity)) {
            case 'Model':
                this.solveModel(entity);
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
        return option.some(this.entities[name]);
    };

    return function (entities) {
        return new Entities(entities);    
    };
}());
    
    