/*jshint -W061 */

/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

var option = require('../../Data/option.js'),
    base64 = require('../../Data/base64.js'),
    naming = require('../../Thicket/resource/naming.js'),
    parseArgv = require('yargs');

// ------------------------------------------------------------------------------

function main(process) {
    var argv = parseArgv.usage('Usage: $0 -i dir -o dir [-v] [-d] [-s] [-n] filenames*')
                        .string("i").string("o").boolean("v").boolean("n").boolean("d").argv,
        fsreader = require('../resource/drivers/fsdriver.js')('.'),
        reader = option.some(argv.i).map(function(directory) {
                return require('../resource/drivers/fsdriver.js')(directory);
            }).map(function(driver) { 
                return require('../resource/reader.js')(driver); 
            }),
        writer = option.some(argv.o).map(function(directory) { 
                return require('../resource/writer.js')(directory); 
            }),
        specifications = argv.s,
        natives = argv.n,
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
            var specification = JSON.parse(fsreader.readContent(specificationFile)),
                aPackage = {
                    definition : specification,
                    content : {}
                };
    
            if (verbose) {
                console.log(("[" + specification.name + "]").green + " - Reading definition");
            }

            specification.modules.forEach(function(aModule) {
                if (verbose) {
                    console.log(("[" + aModule + "]").green + " - Module objcode added");    
                }
                aPackage.content[naming.objcode(aModule)] = reader.get().code(aModule);
            });
            
            if (natives && specification.native && specification.native.javascript) {
                specification.native.javascript.forEach(function(native) {
                    if (verbose) {
                        console.log(("[" + native + "]").green + " - Native code added");    
                    }
                    aPackage.content[native] = base64.encode(reader.get().content(native));
                });
            }

            writer.get().packageCode(specification.name , aPackage);
            
            if (verbose) {
                console.log(("[" + specification.name + "]").green + " - Package for objcode built");
            }
            
            if (specifications) {
                specification.modules.forEach(function(aModule) {
                    if (verbose) {
                        console.log(("[" + aModule + "]").green + " - Module specification added");    
                    }
                    aPackage.content[naming.specification(aModule)] = reader.get().specification(aModule);
                });
                
                writer.get().packageSpecificationAndCode(specification.name , aPackage);
                
                if (verbose) {
                    console.log(("[" + specification.name + "]").green + " - Package for specification built");
                }
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
