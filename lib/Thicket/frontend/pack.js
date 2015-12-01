/*jshint -W061 */

/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

var option = require('../../Data/option.js'),
    naming = require('../../Thicket/resource/naming.js'),
    parseArgv = require('yargs');

// ------------------------------------------------------------------------------

function main(process) {
    var argv = parseArgv.usage('Usage: $0 -i dir -o dir [-v] [-d] -b specifications*')
                        .string("i").string("o").boolean("v").boolean("d").argv,
        fsreader = require('../resource/drivers/fsdriver.js')('.'),
        reader = option.some(argv.i).map(function(directory) {
                return require('../resource/drivers/fsdriver.js')(directory);
            }).map(function(driver) { 
                return require('../resource/reader.js')(driver); 
            }),
        writer = option.some(argv.o).map(function(directory) { 
                return require('../resource/writer.js')(directory); 
            }),
        verbose = argv.v,
        debug = argv.d;
    
    require('colors');

    reader.orLazyElse(function () {
        console.log("import directory is missing -i <dir>".red);
        process.exit(1);
    });

    writer.orLazyElse(function () {
        console.log("output directory is missing -o <dir>".red);
        process.exit(1);
    });
    
    argv._.map(function(specificationFile) {
        try {
            if (verbose) {
                console.log("[DEBUG]".blue + " " + specificationFile.green + " - Reading");
            }

            var specification = fsreader.readContent(specificationFile);
            
            var aPackage = {
                definition : specification,
                content : {}
            };
    
            specification.modules.forEach(function(aModule) {
                aPackage.content[naming.specification(aModule)] = reader.get().specification(aModule);
            });

            specification.modules.forEach(function(aModule) {
                aPackage.content[naming.objcode(aModule)] = reader.get().code(aModule);
            });

            writer.get().package(specification.name , aPackage);
            
            if (verbose) {
                console.log("[DEBUG]".blue + " " + ("[" + specification.name + "]").green + " - Package built");
            }
        } catch (e) {
            console.log("[ERROR]".red + " "  + specificationFile.green + " - " + e.message);
            if (debug) {
                console.log("[ERROR]".red + " " + e.stack);
            }
        }
    });
}

main(process);
