/*jshint -W061 */

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

var option = require('../Data/option.js'),
    parseArgv = require('yargs');

// ------------------------------------------------------------------------------

function endOfSource(line) {
    return line.length >= 3 && line.slice(line.length-3,line.length) === ";;\n";
}

function getSource(line) {
    return line.toString().replace(/;;\n$/,'');
}

function main(process) {
    var line = "",
        allEntities = [],
        argv = parseArgv.usage('Usage: $0 [-i dir]').string("i").argv,
        driver = option.some(argv.i).map(function(directory) {
            return require('../Resource/drivers/fsdriver.js')(directory);
        }),
        runtime = require('../Runtime/runtime.js'),
        toplevel = require('./toplevel.js')(driver, runtime);
        
    require('colors');

    driver.orLazyElse(function () {
        console.log("[W]".blue + " importation not active (missing -i dir option)");
    });

    allEntities = toplevel.manageEntities(allEntities, "from Boot import *");
    
    process.stdout.write("Movico v0.1\n".green.bold);
    process.stdout.write("> ".blue.bold);

    process.stdin.on('readable', function() {
        var chunk = process.stdin.read();
        if (chunk !== null) {
            if (endOfSource(chunk.toString())) {
                line += getSource(chunk);
                            
                if (line.length > 0) {
                    allEntities = toplevel.manage(allEntities, line);
                }

                line = "";
                process.stdout.write("> ".blue.bold);
            } else {
                line += chunk;
            }
        }
    });

    process.stdin.on('end', function() {
        process.stdout.write('\nsee you later ...\n');
    });
}

main(process);
