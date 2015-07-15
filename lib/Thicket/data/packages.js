/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';
    
    var option = require('../../Data/option.js'),
        list = require('../../Data/list.js'),
        aPackage = require('./package.js'),
        ast = require('../syntax/ast.js');
    
    // 
    // Packages management component
    //
    
    function Packages(manager) {
        this.packages = {};        
        this.manager = manager;
    }
    
    Packages.prototype.contains = function(name) {
        return this.packages.hasOwnProperty(name);  
    };
    
    Packages.prototype.list = function () {
        var self = this;
        
        return list(Object.keys(self.packages).map(function(key){
            return self.packages[key];
        }));
    };
    
    Packages.prototype.defineInRoot = function(entities) {
        if (!this.retrieve("_").isPresent()) {
            this.define(ast.module("_",[],[]));    
        }

        this.retrieve("_").map(function(aPackage) {
            aPackage.addEntities(entities);
        });
    };
    
    Packages.prototype.define = function(definitions) {
        this.packages[definitions.namespace] = aPackage(definitions);
        
        definitions.entities.map(function(entity) {
            entity.namespace = definitions.namespace;
        });
        
        this.manager.map(function(manager) {
            manager(definitions.namespace);
        });
    };    
    
    Packages.prototype.retrieve = function(name) {
        if (this.contains(name)) {
            return option.some(this.packages[name]);
        }
        
        return option.none();
    };
        
    return function (manager) {
        return new Packages(manager);
    };
}());