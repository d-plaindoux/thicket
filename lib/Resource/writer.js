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
        typegen = require('../Movico/generator/type.js'),
        list = require('../Data/list.js'),
        fs = require('fs');

    function Writer(directory) {
        this.directory = directory;
    }
    
    Writer.prototype.dependencies = function (name, dependencies) {
        var destination = fs.openSync(this.directory + "/" + naming.dependency(name), "w"),
            separator = "";

        fs.writeSync(destination, "[ ");
        dependencies.map(function (dependency) { 
            fs.writeSync(destination, separator);
            fs.writeSync(destination, importgen.dependency(dependency));
            separator = "\n, ";
        });
        fs.writeSync(destination, " ]");

        fs.closeSync(destination);
    };

    Writer.prototype.specification = function (name, entitites, debug) {
        var destination = fs.openSync(this.directory + "/" + naming.specification(name), "w"),
            separator = "";

        fs.writeSync(destination, "[ ");
        entitites.map(function (entity) {                                                       
            fs.writeSync(destination, separator);
            fs.writeSync(destination, typegen.entity(entity, debug));
            separator = "\n, ";
        });
        fs.writeSync(destination, " ]");

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
    };
    
    return function(directory) {
        return new Writer(directory);
    };
}());