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
    native = require('../Runtime/native.js'),
    M = native(require('../Runtime/runtime.js'));

function endOfSource(line) {
    return line.length >= 3 && line.slice(line.length-3,line.length) === ";;\n";
}

function main(process) {
    var line = "",
        allEntities = [];

    process.stdout.write("Movico v0.1\n");
    process.stdout.write("> ");

    process.stdin.on('readable', function() {
        var chunk = process.stdin.read();
        if (chunk !== null) {
            if (endOfSource(chunk.toString())) { // `\n`
                line += chunk.toString().replace(/;;\n$/,'');
                            
                var sentence = movicoc.sentence(allEntities, line);
                
                if (line.length === 0) {
                    // Do nothing
                } else if (sentence.isFailure()) {                    
                    if (sentence.failure().checked) {
                        console.log(sentence.failure().error);
                    } else {
                        var newEntities = movicoc.source(line).flatmap(function (definitionAndEntities) {
                            return movicoc.entities(allEntities, definitionAndEntities[1]).map(function (newEntities) {
                                return newEntities.map(function (entity) {                                                                
                                    M.$$(eval(entity.code));
                                    return entity.entity;
                                });                                
                            });
                        });
                        
                        if (newEntities.isSuccess()) {                    
                            allEntities = allEntities.concat(newEntities.success().value);
                        } else {
                            console.log(newEntities.failure());
                        }
                    }
                } else {
                    try {
                        var result = M.$$(eval(sentence.success().code));
                        console.log(sentence.success().type + " :: " + M.pretty(result));
                    } catch (e) {
                        console.log(sentence.success().type + " :: <failure>");
                        console.log(e);
                    }
                }
                
                line = "";
                process.stdout.write("> ");
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
