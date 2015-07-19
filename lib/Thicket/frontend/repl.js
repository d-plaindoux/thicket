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
        argv = parseArgv.usage('Usage: $0 [-i dir]').string("i").boolean("d").boolean("n").argv,
        driver = option.some(argv.i).map(function(directory) {
            return require('../resource/drivers/fsdriver.js')(directory);
        }),
        debug = argv.d,
        noboot = argv.n,
        dom = require('../runtime/dom.js'),
        native = require('../runtime/native.js'),
        runtime = require('../runtime/runtime.js').extendWith(native).extendWith(dom).setDebug(debug),
        toplevel = require('./toplevel.js')(driver, runtime, debug);

    require('colors');

    driver.orLazyElse(function () {
        console.log("[W]".blue + " importation not active (missing -i dir option)");
    });

    if (debug) {
        console.log("[W]".blue + " debug mode activated");
    }
    
    if (!noboot) {
        toplevel.manage("from Boot import *");
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
                    toplevel.manage(line);
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