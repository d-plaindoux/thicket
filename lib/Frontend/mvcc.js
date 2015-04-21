/*jshint -W061 */

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

var movicoc = require('../Movico/movicoc.js'),
    importgen = require('../Movico/generator/dependency.js'),
    codegen = require('../Movico/generator/code.js'),
    typegen = require('../Movico/generator/type.js'),
    list = require('../Data/list.js'),
    fs = require('fs'),
    parseArgv = require('yargs');

function saveDependencies(directory, name, dependencies) {
    var destination = fs.openSync(directory + "/" + name + ".mvc.d", "w"),
        separator = "";
    
    fs.writeSync(destination, "[ ");
    dependencies.map(function (dependency) { 
        fs.writeSync(destination, separator);
        fs.writeSync(destination, importgen.dependency(dependency));
        separator = "\n, ";
    });
    fs.writeSync(destination, " ]");
    
    fs.closeSync(destination);
}

function saveCode(directory, name, allEntities, entitites, debug) {
    var destination = fs.openSync(directory + "/" + name + ".mvc.js","w");
    
    entitites.map(function (entity) {                                      
        codegen.entity(list(allEntities), entity, debug).map(function (codegen) {
            fs.writeSync(destination, codegen);
            fs.writeSync(destination, ";\n");
        });
    });
    
    fs.closeSync(destination);
}

function saveSpecification(directory, name, entitites, debug) {
    var destination = fs.openSync(directory + "/" + name + ".mvc.i", "w"),
        separator = "";
    
    fs.writeSync(destination, "[ ");
    entitites.map(function (entity) {                                                       
        fs.writeSync(destination, separator);
        fs.writeSync(destination, typegen.entity(entity, debug));
        separator = "\n, ";
    });
    fs.writeSync(destination, " ]");
    
    fs.closeSync(destination);    
}

function main() {
    var allEntities = [],
        argv = parseArgv.
                    usage('Usage: $0 [-o dir] [-d] <mvc files>').
                    string("o").boolean("d").argv,
        output = argv.o,
        debug = argv.d;
    
    argv._.forEach(function(value) {
        var source = fs.readFileSync(value),
            moduleDefinitionAndEntities = movicoc.module(source.toString()).flatmap(function (moduleDefinitionAndEntities) {
                console.log("Compiling module " + moduleDefinitionAndEntities[0].join('.'));
                
                return movicoc.entities(allEntities, moduleDefinitionAndEntities[1][1]).map(function () {
                    return moduleDefinitionAndEntities;
                });
            });

        if (moduleDefinitionAndEntities.isSuccess()) { 
            var moduleName = moduleDefinitionAndEntities.success()[0].join('.'),
                dependencies = moduleDefinitionAndEntities.success()[1][0],
                newEntities = moduleDefinitionAndEntities.success()[1][1];
            
            allEntities = allEntities.concat(newEntities);

            if (output) {
                console.log("Generating module " + moduleName);
                saveDependencies(argv.o, moduleName, dependencies);
                saveCode(argv.o, moduleName, allEntities, newEntities, debug);
                saveSpecification(argv.o, moduleName, newEntities, debug);
            }
        } else {
            console.log(moduleDefinitionAndEntities.failure());
        }
    });
}

main(process);
