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
    atry = require('../Data/atry.js'),
    option = require('../Data/option.js'),
    fs = require('fs'),    
    parseArgv = require('yargs');

require('colors');

function main() {
    var allEntities = [],
        argv = parseArgv.
                    usage('Usage: $0 [-i dir] [-o dir] [-d] <mvc files>').
                    string("o").string("i").boolean("d").argv,            
        driver = option.some(argv.i || argv.o).map(function(directory) {
            return require('../Resource/drivers/fsdriver.js')(directory);
        }),
        reader = driver.map(function(driver) {
            return require('../Resource/reader.js')(driver);    
        }),        
        writer = option.some(argv.o).map(function(directory) {
            return require('../Resource/writer.js')(directory);
        }),
        modules = require('../Resource/modules')(option.none()),        
        debug = argv.d,        
        loadedModules;
    
    reader.orLazyElse(function () {
        console.log("[WARNING]".blue + " importation not active (missing -i dir or -o dir option)");
    });
    
    writer.orLazyElse(function () {
        console.log("[WARNING]".blue + " compilation not active (missing -o dir option)");
    });
    
    // First stage: load source and declare modules
    loadedModules = argv._.map(function(value) {
        var source;
        
        try {
            source = fs.readFileSync(value).toString();
        } catch (e) {
            return atry.failure(e);
        }
        
        var result = movicoc.module(source);
        
        if (result.isSuccess()) {
            return result.map(function (moduleDefinitionAndEntities) {
                var moduleName = moduleDefinitionAndEntities[0].join('.');

                if (debug) {
                    console.log("[DEBUG]".blue + " " + ("[" + moduleName + "]").green + " - Loading");
                }

                modules.define(moduleName);                   
                return moduleDefinitionAndEntities;
            });
        } else {
            return atry.failure(new Error(value.green + " - " + result.failure().message));
        }
    });
                                                                                                          
    // Second stage: resolve all imports
    loadedModules.forEach(function(loadedModule) {
        loadedModule.map(function(moduleDefinitionAndEntities) {
            var moduleName = moduleDefinitionAndEntities[0].join('.');

            if (debug) {
                console.log("[DEBUG]".blue + " " + ("[" + moduleName + "]").green + " - Resolving");
            }
            
            reader.map(function(reader) {
                allEntities = allEntities.concat(movicoc.imports(modules, reader, moduleDefinitionAndEntities[1][0]));
                allEntities = allEntities.concat(moduleDefinitionAndEntities[1][1]);
            });
        });
    });
              
    // Third stage: type check and compile modules                                     
    loadedModules.forEach(function(loadedModule) {            
        if (!loadedModule.isSuccess()) {
            console.log("[ERROR]".red + " " + loadedModule.failure().message);
            return;
        } 
        
        var moduleName = loadedModule.success()[0].join('.'),
            moduleDefinitionAndEntities;
        
        if (debug) {
            console.log("[DEBUG]".blue + " " + ("[" + moduleName + "]").green + " - Checking");
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
                    console.log("[DEBUG]".blue + " " + ("[" + moduleName + "]").green + " - Compiling");
                }
        
                writer.code(moduleName, allEntities, newEntities, debug);
                writer.specification(moduleName, dependencies, newEntities, debug);
            });
        } else {
            console.log("[ERROR]".red + " "  + ("[" + moduleName + "]").green + " - " + moduleDefinitionAndEntities.failure().message);
        }
    });
}

main(process);
