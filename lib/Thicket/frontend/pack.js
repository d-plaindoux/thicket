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
    var argv = parseArgv.usage('Usage: $0 -i dir').string("i").string("o").string("p").argv,
        fsreader = require('../resource/drivers/fsdriver.js')('.'),
        specificationFile = option.some(argv.p),
        reader = option.some(argv.i).map(function(directory) {
                return require('../resource/drivers/fsdriver.js')(directory);
            }).map(function(driver) { 
                return require('../resource/reader.js')(driver); 
            }),
        writer = option.some(argv.o).map(function(directory) { 
                return require('../resource/writer.js')(directory); 
            });

    reader.orLazyElse(function () {
        console.log("import directory is missing -i <dir>".red);
        process.exit(1);
    });

    writer.orLazyElse(function () {
        console.log("output directory is missing -o <dir>".red);
        process.exit(1);
    });
    
    specificationFile.orLazyElse(function () {
        console.log("package specification is missing -p <specification>".red);
        process.exit(1);
    });
    
    // Read Package specification
    var specification = fsreader.readContent(specificationFile.get());
    var aPackage = {
        package : specification,
        content : {}
    };
    
    specification.modules.forEach(function(aModule) {
        aPackage.content[naming.specification(aModule)] = reader.get().specification(aModule);
        aPackage.content[naming.objcode(aModule)] = reader.get().code(aModule);
    });
    
    writer.get().package(specification.name,aPackage);
}

main(process);
