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
    list = require('../../Data/list.js'),
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
        argv = parseArgv.usage('Usage: $0 [-i dir]').string("i").string("p").boolean("d").boolean("n").argv,
        fsdriver = option.some(argv.i).map(function(directory) {
            return require('../resource/drivers/fsdriver.js')(directory);
        }),
        reader = fsdriver.map(function(driver) { 
            return require('../resource/reader.js')(driver); 
        }),
        debug = argv.d,
        boot = !argv.n,
        runtime = require('../runtime/runtime.js')(reader).setDebug(debug),
        toplevel = require('./toplevel.js')(reader, runtime, debug);
    
    require('colors');

    reader.orLazyElse(function () {
        console.log("[W]".blue + " importation not active (missing -i dir option)");
    });

    if (debug) {
        console.log("[W]".blue + " debug mode activated");
    }
    
    option.some(argv.p).map(function(names) {
        list(names).map(function(name) {
            toplevel.loadPackage(name);
        });
    });

    if (boot) {
        toplevel.loadSpecifications("Boot.Core");
    } else {
        console.log("[W]".blue + " bootstrap deactivated");
    }
 
    process.stdout.write("Thicket v0.1\n".green.bold);
    process.stdout.write("> ".blue.bold);

    process.stdin.on('readable', function() {
        var chunk = process.stdin.read();
        if (chunk !== null) {
            if (endOfSource(chunk.toString())) {
                line += getSource(chunk);

                if (line.length > 0) {
                    toplevel.manageSourceCode(line);
                }

                line = "";
                process.stdout.write("> ".blue.bold);
            } else {
                line += chunk;
            }
        }
    });

    process.stdin.on('end', function() {
        process.stdout.write('\n');
        process.stdout.write('see you later ...\n');
    });
}

main(process);
