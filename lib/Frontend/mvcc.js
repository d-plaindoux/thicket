/*jshint -W061 */

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

var movicoc = require('../Movico/movicoc.js');

function main(process) {
    var line = "";
    var allEntities = [];

    process.stdin.on('readable', function() {
        var chunk = process.stdin.read();
        if (chunk !== null) {
            line += chunk;
        }
    });

    process.stdin.on('end', function() {
        var newEntities = movicoc.entities(allEntities, line);
        if (newEntities.isSuccess()) {
            allEntities = allEntities.concat(newEntities.success().map(function (entity) {                                                                
                process.stdout.write(entity.code);
                process.stdout.write(";\n");
                return entity.entity;
            }).value);
        } else {
            console.log(newEntities.failure());
        }        
    });
}

main(process);
