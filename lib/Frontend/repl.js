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
    native = require('../Runtime/native.js'),
    browser = require('../Runtime/browser.js'),
    M = browser(native(require('../Runtime/runtime.js'))),
    list = require('../Data/list.js'),
    option = require('../Data/option.js'),
    stringify = require('../Movico/syntax/stringify.js'),
    fs = require('fs'),
    parseArgv = require('yargs');

require('colors');

// ------------------------------------------------------------------------------

function readDependencies(directory) {
    return function(name) {
        return JSON.parse(fs.readFileSync(directory + "/" + name + ".mvc.d"));
    };
}

function readSpecificationsAndCode(directory) {
    return function(name) {
        var environment = JSON.parse(fs.readFileSync(directory + "/" + name + ".mvc.i"));
        console.log("Loading".bold + " " + name.green);
        try {
            M.$$(eval(fs.readFileSync(directory + "/" + name + ".mvc.js").toString())(M));
        } catch (e) {
            // Nothing ?
        }
        return environment;
    };
}

// ------------------------------------------------------------------------------

function endOfSource(line) {
    return line.length >= 3 && line.slice(line.length-3,line.length) === ";;\n";
}

function getSource(line) {
    return line.toString().replace(/;;\n$/,'');
}

function manageSentence(allEntities, line) {
    var sentence = movicoc.sentence(allEntities, line);
    
    return sentence.map(function(sentence) {
        if (sentence.isFailure()) {
            console.log("[E]".red + " " + sentence.failure().message.underline);
            return allEntities;

        } else {
            var code = codegen.sentence(list(allEntities), sentence.success().expr);

            if (code.isSuccess()) {
                try {                    
                    var result = M.$$(eval(code.success()));
                    console.log(stringify(sentence.success().type).bold + " :: " + M.pretty(result));
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

function manageEntities(directory, allEntities, line) {        
    var newEntities = allEntities,
        definitionAndEntities = movicoc.source(line).flatmap(function (definitionAndEntities) {        
            directory.map(function(directory) {
                var loadedEntities = movicoc.imports(readSpecificationsAndCode(directory), 
                                                     readDependencies(directory), 
                                                     definitionAndEntities[0]);
                
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
                M.$$(eval(code)(M));
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
        input = option.some(argv.i);
    
    input.orLazyElse(function () {
        console.log("[W]".blue + " importation not active (missing -i dir option)");
    });

    allEntities = manageEntities(input, allEntities, "from Boot import *");
    
    process.stdout.write("Movico v0.1\n".green.bold);
    process.stdout.write("> ".blue.bold);

    process.stdin.on('readable', function() {
        var chunk = process.stdin.read();
        if (chunk !== null) {
            if (endOfSource(chunk.toString())) { // `\n`
                line += getSource(chunk);
                            
                if (line.length > 0) {
                    allEntities = manageSentence(allEntities, line).orLazyElse(function() {
                        return manageEntities(input, allEntities, line);
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
