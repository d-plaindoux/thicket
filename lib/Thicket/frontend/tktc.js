/*jshint -W061 */

/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

var analyzer = require('../compiler/analyzer.js'),
    compiler = require('../compiler/compiler.js'),
    atry = require('../../Data/atry.js'),
    option = require('../../Data/option.js'),
    fs = require('fs'),    
    parseArgv = require('yargs');

function main() {
    var argv = parseArgv.
                    usage('Usage: $0 [-i dir] [-o dir] [-d] [-v] <mvc files>').
                    string("o").string("i").boolean("d").boolean("v").argv,            
        driver = option.some(argv.i || argv.o).map(function(directory) {
            return require('../resource/drivers/fsdriver.js')(directory);
        }),
        reader = driver.map(function(driver) {
            return require('../resource/reader.js')(driver);    
        }),        
        writer = option.some(argv.o).map(function(directory) {
            return require('../resource/writer.js')(directory);
        }),
        packages = require('../compiler/data/packages.js')(option.none()),
        linker = require('../compiler/data/linker.js'),
        environment = require('../compiler/data/environment.js'),
        verbose = argv.v,        
        debug = argv.d,
        loadedModules;

    require('colors');

    reader.orLazyElse(function () {
        console.log("[WARNING]".blue + " importation not active (missing -i dir or -o dir option)");
    });
    
    writer.orLazyElse(function () {
        console.log("[WARNING]".blue + " compilation not active (missing -o dir option)");
    });
    
    // First stage: load source and declare packages
    loadedModules = argv._.map(function(value) {
        var source;
        
        try {
            source = fs.readFileSync(value).toString();
        } catch (e) {
            return atry.failure(e);
        }
        
        var result = analyzer.module(source, value);
        
        if (result.isSuccess()) {
            return result.map(function (currentModule) {
                var moduleName = currentModule.namespace;

                if (verbose) {
                    console.log("[DEBUG]".blue + " " + ("[" + moduleName + "]").green + " - Reading");
                }

                packages.define(currentModule);        
                
                return currentModule;
            });
        } else {
            return atry.failure(new Error(value.green + " - " + result.failure().message));
        }
    });
                                                                                                          
    // Second stage: resolve all imports
    loadedModules.forEach(function(loadedModule) {
        loadedModule.map(function(currentModule) {
            var moduleName = currentModule.namespace;

            if (verbose) {
                console.log("[DEBUG]".blue + " " + ("[" + moduleName + "]").green + " - Importing");
            }
            
            reader.map(function(reader) {
                analyzer.imports(packages, reader, currentModule.imports);
            });
        });
    });
              
    // Third stage: type check and compile packages                                     
    loadedModules.forEach(function(loadedModule) {   
        if (!loadedModule.isSuccess()) {
            console.log("[ERROR]".red + " " + loadedModule.failure().message);
            if (debug) {
                console.log("[ERROR]".red + " " + loadedModule.failure().stack);
            }
            return;
        } 
        
        var currentModule = loadedModule.success(),
            moduleName = currentModule.namespace,
            linkage;
    
        if (verbose) {
            console.log("[DEBUG]".blue + " " + ("[" + moduleName + "]").green + " - Resolving");
        }
        
        linkage = linker(packages).linkPackageByName(currentModule.namespace);
        
        if (linkage.isFailure()) {
            console.log("[ERROR]".red + " "  + ("[" + moduleName + "]").green + " - " + linkage.failure().message);
            if (debug) {
                console.log("[ERROR]".red + " " + linkage.failure().stack);
            }
        }
    });

    // Fourth stage: type check and compile packages                                     
    loadedModules.forEach(function(loadedModule) {   
        if (!loadedModule.isSuccess()) {
            return;
        } 
        
        var currentModule = loadedModule.success(),
            moduleName = currentModule.namespace,
            analysis;
    
        if (verbose) {
            console.log("[DEBUG]".blue + " " + ("[" + moduleName + "]").green + " - Checking");
        }

        analysis = analyzer.entities(environment(packages), currentModule.entities);

        if (analysis.isFailure()) { 
            console.log("[ERROR]".red + " "  + ("[" + moduleName + "]").green + " - " + analysis.failure().message);
            if (debug) {
                console.log("[ERROR]".red + " " + analysis.failure().stack);
            }
            return;
        }
            
        writer.map(function(writer) {
            var namespace = currentModule.namespace,
                moduleName = namespace,
                dependencies = currentModule.imports,
                newEntities = currentModule.entities;

            if (verbose) {
                console.log("[DEBUG]".blue + " " + ("[" + moduleName + "]").green + " - Compiling");                
            }

            writer.code(moduleName, compiler.code(namespace, environment(packages), dependencies, newEntities), debug);
        });    
    });
}

main(process);
