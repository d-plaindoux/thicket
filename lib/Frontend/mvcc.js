/*jshint -W061 */

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

var movicoc = require('../Movico/movicoc.js'),
    fs = require('fs'),
    parseArgv = require('minimist');

function saveGeneratedCode(directory, name, entitites) {
    var destination = fs.openSync(directory + "/" + name + ".js","w");
    
    entitites.map(function (entity) {                                                         
        fs.writeSync(destination, entity.code);
        fs.writeSync(destination, ";\n");
    });
    
    fs.closeSync(destination);
}

function main(process) {
    var allEntities = [],
        argv = parseArgv(process.argv.slice(2));
    
    argv._.forEach(function(value) {
        var source = fs.readFileSync(value),
            newEntities = movicoc.module(source.toString()).flatmap(function (moduleDefinitionAndEntities) {
                return movicoc.entities(allEntities, moduleDefinitionAndEntities[1][1]).map(function (entities) {
                    return [moduleDefinitionAndEntities[0], entities];
                });
            });

        if (newEntities.isSuccess()) {                                
            console.log("Compiling module " + newEntities.success()[0]);

            if (argv.o) {
                saveGeneratedCode(argv.o, newEntities.success()[0], newEntities.success()[1]);
            }
            
            allEntities = allEntities.concat(newEntities.success()[1].map(function (entity) {                                                         
                return entity.entity;
            }).value);
        } else {
            console.log(newEntities.failure());
        }
    });
}

main(process);
