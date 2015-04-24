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
    option = require('../Data/option.js'),
    stringify = require('../Movico/syntax/stringify.js'),
    parseArgv = require('yargs');

require('colors');

function codeEvaluation(code, runtime) {
    return runtime.$$(eval(code)(runtime));
}

function moduleEvaluation(reader, runtime) {
    return function(name) {
        reader.map(function(reader) {
            codeEvaluation(reader.code(name), runtime);
        });
    };
}

// ------------------------------------------------------------------------------

function endOfSource(line) {
    return line.length >= 3 && line.slice(line.length-3,line.length) === ";;\n";
}

function getSource(line) {
    return line.toString().replace(/;;\n$/,'');
}

function manageSentence(runtime, allEntities, line) {
    var sentence = movicoc.sentence(allEntities, line);
    
    return sentence.map(function(sentence) {
        if (sentence.isFailure()) {
            console.log("[E]".red + " " + sentence.failure().message.underline);
            return allEntities;

        } else {
            var code = codegen.sentence(list(allEntities), sentence.success().expr);

            if (code.isSuccess()) {
                try {                
                    var result = codeEvaluation(code.success(), runtime);
                    console.log(stringify(sentence.success().type).bold + " :: " + runtime.pretty(result));
                } catch (e) {
                    console.log(stringify(sentence.success().type).bold + " :: <failure>");
                    console.log("[E]".red + " " + e.message.underline);
                }
            } else {
                console.log("[E]".red + " " + code.failure().message);
            }

            return allEntities;
        }            
    });
}

function manageEntities(runtime, modules, reader, allEntities, line) {        
    var newEntities = allEntities,
        definitionAndEntities = movicoc.source(line).flatmap(function (definitionAndEntities) {        
            reader.map(function(reader) {
                var loadedEntities = movicoc.imports(modules,reader,definitionAndEntities[0]);
                
                newEntities = newEntities.concat(loadedEntities);
            });
        
            return movicoc.entities(allEntities, definitionAndEntities[1]).map(function() {
                return definitionAndEntities;
            });
        });

    if (definitionAndEntities.isSuccess()) {                    
        var entities = definitionAndEntities.success()[1];
            
        newEntities = newEntities.concat(entities);

        entities.map(function(entity) {
            codegen.entity(list(newEntities), entity).map(function(code) {
                codeEvaluation(code, runtime);
            });
        });
        
        return newEntities;
    } else {
        console.log("[E]".red + " - " + definitionAndEntities.failure().message);
        return newEntities;
    }
}

function main(process) {
    var line = "",
        allEntities = [],
        argv = parseArgv.
                    usage('Usage: $0 [-i dir]').
                    string("i").argv,
    
        reader = option.some(argv.i).map(function(directory) {
            return require('../Resource/reader.js')(directory);    
        }),
        
        native = require('../Runtime/native.js'),
        browser = require('../Runtime/browser.js'),
        runtime = browser(native(require('../Runtime/runtime.js'))),

        modules = require('../Resource/modules')(option.some(moduleEvaluation(reader, runtime)));
        
    reader.orLazyElse(function () {
        console.log("[W]".blue + " importation not active (missing -i dir option)");
    });

    allEntities = manageEntities(runtime, modules, reader, allEntities, "from Boot import *");
    
    process.stdout.write("Movico v0.1\n".green.bold);
    process.stdout.write("> ".blue.bold);

    process.stdin.on('readable', function() {
        var chunk = process.stdin.read();
        if (chunk !== null) {
            if (endOfSource(chunk.toString())) { // `\n`
                line += getSource(chunk);
                            
                if (line.length > 0) {
                    allEntities = manageSentence(runtime, allEntities, line).orLazyElse(function() {
                        return manageEntities(runtime, modules, reader, allEntities, line);
                    });
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
