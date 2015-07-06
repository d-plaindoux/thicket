/*jshint -W061 */

/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

var analyzer = require('../Thicket/analyzer.js'),
    compiler = require('../Thicket/compiler.js'),
    builder = require('../Thicket/checker/builder.js'),
    atry = require('../Data/atry.js'),
    option = require('../Data/option.js'),
    fs = require('fs'),    
    parseArgv = require('yargs');

require('colors');

function main() {
    var argv = parseArgv.
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
        
        var result = analyzer.module(source);
        
        if (result.isSuccess()) {
            return result.map(function (currentModule) {
                var moduleName = currentModule.namespace.join('.');

                if (debug) {
                    console.log("[DEBUG]".blue + " " + ("[" + moduleName + "]").green + " - Loading");
                }

                modules.define(moduleName, currentModule);        
                
                return currentModule;
            });
        } else {
            return atry.failure(new Error(value.green + " - " + result.failure().message));
        }
    });
                                                                                                          
    // Second stage: resolve all imports
    loadedModules.forEach(function(loadedModule) {
        loadedModule.map(function(currentModule) {
            var moduleName = currentModule.namespace.join('.');

            if (debug) {
                console.log("[DEBUG]".blue + " " + ("[" + moduleName + "]").green + " - Resolving");
            }
            
            reader.map(function(reader) {
                analyzer.imports(modules, reader, currentModule.imports);
            });
        });
    });
              
    // Third stage: type check and compile modules                                     
    loadedModules.forEach(function(loadedModule) {   
        if (!loadedModule.isSuccess()) {
            console.log("[ERROR]".red + " " + loadedModule.failure().message);
            return;
        } 
        
        var currentModule = loadedModule.success(),
            moduleName = currentModule.namespace.join('.'),
            allEntities = currentModule.entities,
            analysis;
        
        currentModule.imports.forEach(function(anImport) {
            modules.retrieve(anImport.namespace.join('.')).map(function (importedModule) {
                if (anImport.names.length === 0) {
                    allEntities = allEntities.concat(importedModule.entities);
                } else {
                    anImport.names.forEach(function(name) {
                        importedModule.entities.forEach(function(entity) {
                            if (builder.entityName(entity) === name) {
                                allEntities = allEntities.concat([entity]);
                            }
                        });
                    });
                }
            });
        });
        
        if (debug) {
            console.log("[DEBUG]".blue + " " + ("[" + moduleName + "]").green + " - Checking");
        }
        
        analysis = analyzer.entities(allEntities, currentModule.entities);

        if (analysis.isSuccess()) { 
            writer.map(function(writer) {
                var namespace = currentModule.namespace,
                    moduleName = namespace.join('.'),
                    dependencies = currentModule.imports,
                    newEntities = currentModule.entities;
                
                if (debug) {
                    console.log("[DEBUG]".blue + " " + ("[" + moduleName + "]").green + " - Compiling");
                }
        
                writer.code(moduleName, compiler.code(namespace, allEntities, newEntities), debug);
                writer.specification(moduleName, compiler.specification(namespace, dependencies, newEntities), debug);
            });
        } else {
            console.log("[ERROR]".red + " "  + ("[" + moduleName + "]").green + " - " + analysis.failure().message);
        }
    });
}

main(process);
