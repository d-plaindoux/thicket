/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';

    var naming = require('./naming.js'),
        importgen = require('../Movico/generator/dependency.js'),
        codegen = require('../Movico/generator/code.js'),
        codegen2 = require('../Movico/generator/code2.js'),
        typegen = require('../Movico/generator/type.js'),
        list = require('../Data/list.js'),
        fs = require('fs');

    function Writer(directory) {
        this.directory = directory;
    }

    function replacer(key,value) {
        if (key === "$location") {
            return undefined;
        } 
        
        return value;
    }
    

    Writer.prototype.specification = function (name, dependencies, entitites, debug) {
        var destination = fs.openSync(this.directory + "/" + naming.specification(name), "w");

        var specifications = {
            dependencies: dependencies.map(function(dependency) { return importgen.dependency(dependency); }),
            definitions: entitites.map(function(entity) { return typegen.entity(entity); })
        };

        if (debug) {
            fs.writeSync(destination, JSON.stringify(specifications));
        } else {
            fs.writeSync(destination, JSON.stringify(specifications, replacer));        
        }

        fs.closeSync(destination);    
    };

    Writer.prototype.code = function (name, allEntities, entitites, debug) {
        var destination = fs.openSync(this.directory + "/" + naming.code(name),"w");

        fs.writeSync(destination,"(function() {\n");
        fs.writeSync(destination,"return function(runtime) {\n");
        fs.writeSync(destination,"runtime.module('" + name + "',function() {\n");        
        entitites.map(function (entity) {
            codegen.entity(list(allEntities), entity, debug).map(function (codegen) {
                fs.writeSync(destination, codegen);
                fs.writeSync(destination, ";\n");
            });
        });
        fs.writeSync(destination,"});\n");
        fs.writeSync(destination,"};\n");
        fs.writeSync(destination,"}());");

        fs.closeSync(destination);
        
        this.code2(name, allEntities, entitites, debug);
    };

    Writer.prototype.code2 = function (name, allEntities, entitites, debug) {
        var destination = fs.openSync(this.directory + "/" + naming.code(name) + "2","w");

        entitites.map(function (entity) {
            codegen2.entity(list(allEntities), entity, debug).map(function (codegen) {
                fs.writeSync(destination, JSON.stringify(codegen));
                fs.writeSync(destination, ";\n");
            });
        });

        fs.closeSync(destination);
    };

    return function(directory) {
        return new Writer(directory);
    };
}());