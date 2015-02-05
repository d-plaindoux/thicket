/*jshint -W061 */

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

var movicoc = require('./movicoc.js').movicoc,
    M = require('./movico.js').M;

// Extend String 
function endsWith(value, s) {
  return value.length >= s.length && value.substr(value.length - s.length) === s;
}

function endOfSource(line) {
    return endsWith(line.replace(/\s*$/, ''), ';;');
}

function main(process) {
    var line = "";
    var allEntities = [];

    process.stdout.write("Movico 0.1\n");
    process.stdout.write("> ");

    process.stdin.on('readable', function() {
        var chunk = process.stdin.read();
        if (chunk !== null) {
            if (endOfSource(chunk.toString())) { // `\n`
                line += chunk.toString().replace(/;;\n$/,'');
                            
                var sentence = movicoc.sentence(allEntities, line);
                
                if (sentence.isFailure()) {                    
                    if (sentence.failure()[0]) {
                        console.log(sentence.failure()[1]);
                    } else {
                        var newEntities = movicoc.entities(allEntities, line);
                        if (newEntities.isSuccess()) {
                            allEntities = allEntities.concat(newEntities.success().map(function (entity) {                                                                
                                M.$$(eval(entity[1]));
                                return entity[0];
                            }).value);
                        } else {
                            console.log(newEntities.failure());
                        }
                    }
                } else {
                    try {
                        var result = M.$$(eval(sentence.success()[1]));
                        console.log(sentence.success()[0] + " :: " + M.pretty(result));
                    } catch (e) {
                        console.log(sentence.success()[0] + " :: <failure>");
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
