/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';

    var naming = require('./naming.js'),
        importgen = require('../Thicket/generator/dependency.js'),
        abstractSyntax = require('../Thicket/generator/code.js'),
        code = require('../Thicket/generator/objcode.js'),
        typegen = require('../Thicket/generator/type.js'),
        list = require('../Data/list.js'),
        fs = require('fs');

    function Writer(directory) {
        this.directory = directory;
    }

    function removeLocation(key,value) {
        if (key === "$location") {
            return undefined;
        } 
        
        return value;
    }

    Writer.prototype.specification = function (name, namespace, dependencies, entities, debug) {
        var destination = fs.openSync(this.directory + "/" + naming.specification(name), "w");
        
        var specifications = {
                namepace: namespace,
                dependencies: dependencies.map(function(dependency) { return importgen.dependency(dependency); }),
                definitions: entities.map(function(entity) { return typegen.entity(entity); })
            };

        if (debug) {
            fs.writeSync(destination, JSON.stringify(specifications, null, 2));
        } else {
            fs.writeSync(destination, JSON.stringify(specifications, removeLocation, 2));        
        }

        fs.closeSync(destination);    
    };

    Writer.prototype.code = function (name, namespace, allEntities, entities, debug) {
        var destination = fs.openSync(this.directory + "/" + naming.objcode(name),"w"),
            objcode = [];
        
        entities.map(function (entity) {
            abstractSyntax.entity(list(allEntities), entity, debug).map(function (syntax) {
                objcode = objcode.concat(code.generateObjCode(code.deBruijnIndex(syntax)));
            });
        });

        var binary = {
            namespace: namespace,
            objcode: objcode 
        };
        
        fs.writeSync(destination, JSON.stringify(binary,null,2));
        fs.closeSync(destination);
    };

    return function(directory) {
        return new Writer(directory);
    };
}());