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
    list = require('../../Data/list.js'),
    option = require('../../Data/option.js'),
    fs = require('fs'),    
    parseArgv = require('yargs');

function main() {
    var argv = parseArgv.
                    usage('Usage: $0 [-i dir] [-o dir] [-p Package] [-d] [-v] <mvc files>').
                    string("o").string("i").string("p").boolean("d").boolean("v").argv,            
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
        errorFound = false,
        loadedModules;

    require('colors');

    reader.orLazyElse(function () {
        console.log("[WARNING]".blue + " importation not active (missing -i dir or -o dir option)");
    });
    
    writer.orLazyElse(function () {
        console.log("[WARNING]".blue + " compilation not active (missing -o dir option)");
    });
    
    option.some(argv.p).map(function(names) {
        list(names).map(function(name) {
            reader.map(function(reader) {
                reader.addPackageSpecificationAndCode(reader.packageSpecificationAndCode(name));
            });
        });
    });

    // First stage: load source and declare packages
    loadedModules = argv._.map(function(value) {
        var source;
        
        try {
            source = fs.readFileSync(value).toString();
        } catch (e) {
            console.log("[ERROR]".red + " "  + ("[" + value + "]").green + " - " + e.message);
            if (debug) {
                console.log("[ERROR]".red + " " + e.stack);
            }
            
            errorFound = true;
            return atry.failure(e);
        }
        
        var result = analyzer.module(source, value);
        
        if (result.isSuccess()) {
            return result.map(function (currentModule) {
                var moduleName = currentModule.namespace;

                if (verbose) {
                    console.log(("[" + moduleName + "]").green + " - Reading");
                }

                packages.define(currentModule);        
                
                return currentModule;
            });
        } else {
            console.log("[ERROR]".red + " "  + ("[" + value + "]").green + " - " + result.failure().message);
            if (debug) {
                console.log("[ERROR]".red + " " + result.failure().stack);
            }
            
            errorFound = true;
            
            return atry.failure(new Error(value.green + " - " + result.failure().message));
        }
    });
    
        
    if (errorFound) {
        process.exit(1);
    }
                                                                                                          
    // Second stage: resolve all imports
    loadedModules.forEach(function(loadedModule) {
        loadedModule.map(function(currentModule) {
            var moduleName = currentModule.namespace;

            if (verbose) {
                console.log(("[" + moduleName + "]").green + " - Importing");
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
            console.log(("[" + moduleName + "]").green + " - Resolving");
        }
        
        linkage = linker(packages).linkPackageByName(currentModule.namespace);
        
        if (linkage.isFailure()) {
            console.log("[ERROR]".red + " "  + ("[" + moduleName + "]").green + " - " + linkage.failure().message);
            if (debug) {
                console.log("[ERROR]".red + " " + linkage.failure().stack);
            }
            
            errorFound = true;
        }
    });
    
    if (errorFound) {
        process.exit(1);
    }

    // Fourth stage: type check                                     
    loadedModules.forEach(function(loadedModule) {   
        if (!loadedModule.isSuccess()) {
            return;
        } 
        
        var currentModule = loadedModule.success(),
            moduleName = currentModule.namespace,
            analysis;
    
        if (verbose) {
            console.log(("[" + moduleName + "]").green + " - Checking");
        }

        analysis = analyzer.entities(environment(packages), currentModule.entities).flatmap(function(result) {
            return list(currentModule.sentences).foldL(atry.success(result), function(result, sentence) {
                return result.flatmap(function() {
                    return analyzer.sentence(environment(packages), sentence.definition);
                });
            });
        });

        if (analysis.isFailure()) { 
            console.log("[ERROR]".red + " "  + ("[" + moduleName + "]").green + " - " + analysis.failure().message);
            if (debug) {
                console.log("[ERROR]".red + " " + analysis.failure().stack);
            }
            
            errorFound = true;
        }
    });
    
    if (errorFound) {
        process.exit(1);
    }

    // Fourth stage: write code                                     
    loadedModules.forEach(function(loadedModule) {   
        if (!loadedModule.isSuccess()) {
            return;
        } 
        
        var currentModule = loadedModule.success();
        
        writer.map(function(writer) {
            var moduleName = currentModule.namespace,
                dependencies = currentModule.imports,
                newEntities = currentModule.entities,
                sentences = currentModule.sentences;
            
            if (verbose) {
                console.log(("[" + moduleName + "]").green + " - Compiling");                
            }

            writer.code(moduleName, compiler.code(moduleName, environment(packages), newEntities, sentences), debug);
            writer.specification(moduleName, compiler.specification(moduleName, dependencies, newEntities), debug);
        });    
    });
}

main(process);
