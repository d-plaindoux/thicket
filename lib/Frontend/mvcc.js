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
    option = require('../Data/option.js'),
    fs = require('fs'),    
    parseArgv = require('yargs');

require('colors');

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

function readDependencies(directory) {
    return function(name) {
        return JSON.parse(fs.readFileSync(directory + "/" + name + ".mvc.d"));
    };
}

function readSpecifications(directory) {
    return function(name) {
        return JSON.parse(fs.readFileSync(directory + "/" + name + ".mvc.i"));
    };
}

function saveCode(directory, name, allEntities, entitites, debug) {
    var destination = fs.openSync(directory + "/" + name + ".mvc.js","w");
    
    entitites.map(function (entity) {                                      
        fs.writeSync(destination,"(function() {\n");
        fs.writeSync(destination,"return function(M) {\n");
        codegen.entity(list(allEntities), entity, debug).map(function (codegen) {
            fs.writeSync(destination, codegen);
            fs.writeSync(destination, ";\n");
        });
        fs.writeSync(destination,"};\n");
        fs.writeSync(destination,"}());");
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
                    usage('Usage: $0 [-i dir] [-o dir] [-d] <mvc files>').
                    string("o").string("i").boolean("d").argv,
        input = argv.i || argv.o,
        output = argv.o,
        debug = argv.d;
    
    option.some(input).orLazyElse(function () {
        console.log("[W]".blue + " importation not active (missing -i dir or -o dir option)");
    });
    
    option.some(output).orLazyElse(function () {
        console.log("[W]".blue + " compilation not active (missing -o dir option)");
    });
    
    argv._.forEach(function(value) {
        var source = fs.readFileSync(value),
            moduleDefinitionAndEntities = movicoc.module(source.toString()).flatmap(function (moduleDefinitionAndEntities) {
                if (input) {
                    allEntities = allEntities.concat(movicoc.imports(readSpecifications(input), readDependencies(input), moduleDefinitionAndEntities[1][0]));
                }
                
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
                saveDependencies(argv.o, moduleName, dependencies);
                saveCode(argv.o, moduleName, allEntities, newEntities, debug);
                saveSpecification(argv.o, moduleName, newEntities, debug);
            }
        } else {
            console.log("[E]".red + " "  + ("[" + value + "]").green + " - " + moduleDefinitionAndEntities.failure().message);
        }
    });
}

main(process);
