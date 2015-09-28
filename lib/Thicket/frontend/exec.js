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

function loader(reader, runtime, name) {
    var code = reader.code(name);
    
    code.objcode.map(function(entity) {
        runtime.register(entity, code.namespace);
    });
    
    return code;
}

function main(process) {
    var argv = parseArgv.usage('Usage: $0 -i dir').string("i").argv,
        driver = option.some(argv.i).map(function(directory) {
            return require('../resource/drivers/fsdriver.js')(directory);
        }),
        reader = driver.map(function(driver) { 
            return require('../resource/reader.js')(driver); 
        }),
        boot = option.some(argv._[0]),
        dom = require('../runtime/dom.js'),
        backend = require('../runtime/backend.js'),
        native = require('../runtime/native.js'),
        runtime = require('../runtime/runtime.js')(reader).
                    extendWith(native).
                    extendWith(dom).
                    extendWith(backend);

    require('colors');

    driver.orLazyElse(function () {
        console.log("importation is missing -i <dir>".red);
        process.exit(1);
    });

    boot.orLazyElse(function () {
        console.log("main module is missing".red);
        process.exit(1);
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
            }
        });
    });
}

main(process);
