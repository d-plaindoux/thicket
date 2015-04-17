/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var atry = require('../../Data/atry.js'),
        list = require('../../Data/list.js'),
        option = require('../../Data/option.js'),
        exception = require('../exception.js');
        
    function Environment(dependency) {
        this.environment = {};
        this.dependency = dependency;
    }
    
    Environment.prototype.isDefined = function (symbol) {
        return this.environment.hasOwnProperty(symbol);
    };    
    
    Environment.prototype.retrieve = function (symbol) {
        if (this.isDefined(symbol)) {
            return option.some(this.environment[symbol]);
        }
                               
        return option.none();
    };

    Environment.prototype.register = function (entity) {
        this.environment[entity.name] = entity;
        return entity;
    };
    
    function symbolFromModule(name, content) {
        return list(content).findFirst(function(entity) {
            return name === entity.name;
        }).map(function (entity) {
            return atry.success(entity);
        }).orElse(atry.failure(exception("Symbol " + name + " not found")));
    }

    function retrieveFromModule(dependency, aModule) {
        return dependency.resolve(aModule.namespace).flatmap(function (content) {
            var symbols = list(aModule.names);
            
            if (symbols.isEmpty()) {
                // Load all symbols
                return atry.success(list(content));        
            } else {
                // Filter symbols                
                return symbols.foldR(function(name, result) {
                    return result.flatmap(function (result) {                                                
                        return symbolFromModule(name, content).map(function(entity) {
                            return result.add(entity);
                        });                        
                    });
                }, atry.success(list()));
            }
        });
    }
    
    Environment.prototype.importFromModule = function(aModule) {
        var that = this;
        
        return retrieveFromModule(this.dependency, aModule).map(function (entities) {
            return entities.map(function(entity) {
                return that.register(entity);
            });
        });
    };
    
    return function(dependency) {
        return new Environment(dependency);
    };
    
}());