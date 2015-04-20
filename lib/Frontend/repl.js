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
    codegen = require('../Movico/generator/code.js'),
    list = require('../Data/list.js'),
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
                        var definitionAndEntities = movicoc.source(line).flatmap(function (definitionAndEntities) {
                            return movicoc.entities(allEntities, definitionAndEntities[1]).map(function() {
                                return definitionAndEntities;
                            });
                        });
                        
                        if (definitionAndEntities.isSuccess()) {                    
                            var newEntities = definitionAndEntities.success()[1];
                            
                            allEntities = allEntities.concat(newEntities);

                            newEntities.map(function(entity) {
                                codegen.entity(list(allEntities), entity).map(function(code) {
                                    M.$$(eval(code));
                                });
                            });
                        } else {
                            console.log(definitionAndEntities.failure().stack);
                        }
                    }
                } else {
                    var code = codegen.sentence(list(allEntities), sentence.success().expr);
                    
                    if (code.isSuccess()) {
                        try {
                            var result = M.$$(eval(code.success()));
                            console.log(sentence.success().type + " :: " + M.pretty(result));
                        } catch (e) {
                            console.log(sentence.success().type + " :: <failure>");
                            console.log(e);
                        }
                    } else {
                        console.log(code.failure());
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
