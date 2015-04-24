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
    option = require('../Data/option.js'),
    fs = require('fs'),    
    parseArgv = require('yargs');

require('colors');

function main() {
    var allEntities = [],
        argv = parseArgv.
                    usage('Usage: $0 [-i dir] [-o dir] [-d] <mvc files>').
                    string("o").string("i").boolean("d").argv,    
        
        reader = option.some(argv.i || argv.o).map(function(directory) {
            return require('../Resource/reader.js')(directory);    
        }),
        
        writer = option.some(argv.o).map(function(directory) {
            return require('../Resource/writer.js')(directory);
        }),

        modules = require('../Resource/modules')(option.none()),
        
        debug = argv.d,
        
        loadedModules;
    
    reader.orLazyElse(function () {
        console.log("[W]".blue + " importation not active (missing -i dir or -o dir option)");
    });
    
    writer.orLazyElse(function () {
        console.log("[W]".blue + " compilation not active (missing -o dir option)");
    });
    
    // First stage: load source and declare modules
    loadedModules = argv._.map(function(value) {
        return movicoc.module(fs.readFileSync(value).toString()).map(function (moduleDefinitionAndEntities) {
            var moduleName = moduleDefinitionAndEntities[0].join('.');
            
            if (debug) {
                console.log("[D]".blue + " " + ("[" + moduleName + "]").green + " - Loading");
            }
            
            modules.define(moduleName);            
            return moduleDefinitionAndEntities;
        });
    });
                                                                                                          
    // Second stage: resolve all imports
    loadedModules.forEach(function(loadedModule) {
        loadedModule.map(function(moduleDefinitionAndEntities) {
            var moduleName = moduleDefinitionAndEntities[0].join('.');

            if (debug) {
                    console.log("[D]".blue + " " + ("[" + moduleName + "]").green + " - Resolving");
            }
            
            reader.map(function(reader) {
                allEntities = allEntities.concat(movicoc.imports(modules, reader, moduleDefinitionAndEntities[1][0]));
                allEntities = allEntities.concat(moduleDefinitionAndEntities[1][1]);
            });
        });
    });
              
    // Third stage: type check and compile modules                                     
    loadedModules.forEach(function(loadedModule) {
        var moduleName = loadedModule.success()[0].join('.'),
            moduleDefinitionAndEntities;
            
        if (!loadedModule.isSuccess()) {
            console.log("[E]".red + " " + ("[" + moduleName + "]").green + " - " + loadedModule.failure().message);
            return;
        } 
        
        if (debug) {
            console.log("[D]".blue + " " + ("[" + moduleName + "]").green + " - Checking");
        }
        
        moduleDefinitionAndEntities = movicoc.entities(allEntities, loadedModule.success()[1][1]).flatmap(function () {
            return loadedModule;
        });

        if (moduleDefinitionAndEntities.isSuccess()) { 

            writer.map(function(writer) {
                var moduleName = moduleDefinitionAndEntities.success()[0].join('.'),
                    dependencies = moduleDefinitionAndEntities.success()[1][0],
                    newEntities = moduleDefinitionAndEntities.success()[1][1];

                if (debug) {
                    console.log("[D]".blue + " " + ("[" + moduleName + "]").green + " - Compiling");
                }
        
                writer.code(moduleName, allEntities, newEntities, debug);
                writer.dependencies(moduleName, dependencies);
                writer.specification(moduleName, newEntities, debug);
            });
        } else {
            console.log("[E]".red + " "  + ("[" + moduleName + "]").green + " - " + moduleDefinitionAndEntities.failure().message);
        }
    });
}

main(process);
