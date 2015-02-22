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
    fs = require('fs');

function main(process) {
    var allEntities = [];

    process.argv.forEach(function(value, index) {
        if (index < 2) {
            return;
        }
        
        var source = fs.readFileSync(value),
            newEntities = movicoc.entities(allEntities, source.toString());
            
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
