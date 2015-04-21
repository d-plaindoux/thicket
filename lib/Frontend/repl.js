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

function getSource(line) {
    return line.toString().replace(/;;\n$/,'');
}

function compileSentence(allEntities, line) {
    var sentence = movicoc.sentence(allEntities, line);
    
    return sentence.map(function(sentence) {
        if (sentence.isFailure()) {
            console.log(sentence.failure());        
            return allEntities;

        } else {
            var code = codegen.sentence(list(allEntities), sentence.success().expr);

            if (code.isSuccess()) {
                try {
                    var result = M.$$(eval(code.success()));
                    console.log(sentence.success().type + " :: " + M.pretty(result));
                } catch (e) {
                    console.log(sentence.success().type + " :: <failure>");
                    console.log(e.stack);
                }
            } else {
                console.log(code.failure());
            }

            return allEntities;
        }            
    });
}

function compileEntities(allEntities, line) {
    var definitionAndEntities = movicoc.source(line).flatmap(function (definitionAndEntities) {
            return movicoc.entities(allEntities, definitionAndEntities[1]).map(function() {
                return definitionAndEntities;
            });
        });

    if (definitionAndEntities.isSuccess()) {                    
        var entities = definitionAndEntities.success()[1],
            newEntities = allEntities.concat(entities);

        entities.map(function(entity) {
            codegen.entity(list(newEntities), entity).map(function(code) {
                M.$$(eval(code));
            });
        });
        
        return newEntities;
    } else {
        console.log(definitionAndEntities.failure());
        return allEntities;
    }
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
                line += getSource(chunk);
                            
                if (line.length > 0) {
                    allEntities = compileSentence(allEntities, line).orLazyElse(function() {
                        return compileEntities(allEntities, line);
                    });
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
