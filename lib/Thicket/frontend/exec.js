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
    list = require('../../Data/list.js'),
    parseArgv = require('yargs');

// ------------------------------------------------------------------------------

function loader(reader, runtime, name) {
    var code = reader.code(name);
    
    code.objcode.map(function(entity) {
        runtime.register(entity, code.namespace);
    });
    
    return code;
}

function main(process) {
    var argv = parseArgv.usage('Usage: $0 -i dir').string("i").string("p").boolean("d").argv,
        driver = option.some(argv.i).map(function(directory) {
            return require('../resource/drivers/fsdriver.js')(directory);
        }),
        debug = argv.d,
        reader = driver.map(function(driver) { 
            return require('../resource/reader.js')(driver); 
        }),
        boot = option.some(argv._[0]),
        runtime = require('../runtime/runtime.js')(reader).setDebug(debug);

    require('colors');

    driver.orLazyElse(function () {
        console.log("importation is missing -i <dir>".red);
        process.exit(1);
    });

    boot.orLazyElse(function () {
        console.log("main module is missing".red);
        process.exit(1);
    });    
    
    option.some(argv.p).map(function(names) {
        list(names).map(function(name) {
            runtime.loadPackage(name);
        });
    });
    
    reader.map(function(reader) {
        boot.map(function(boot) {
            try {
                var code = loader(reader, runtime, boot, []);
                
                code.main.forEach(function(sentence) {
                    runtime.execute(sentence);
                });
            } catch (e) {
                console.log(e.message);
                if (debug) {
                    console.log(e.stack);
                }
            }
        });
    });
}

main(process);
