/*jshint -W061 */

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

var stream = require('../Parser/stream.js').stream,
    option = require('../Data/option.js').option,
    aTry = require('../Data/atry.js').atry,
    list = require('../Data/list.js').list,
    language = require('../Movico/language.js').language(),
    types = require('../Movico/types.js').types,
    entities = require('../Movico/entities.js').entities,
    expressions = require('../Movico/expressions.js').expressions,
    compiler = require('../Movico/compiler.js').compiler,
    M = require('../Runtime/movico.js').M;

function compileSentence(definedEntities, data) {
    var aStream = stream(data),
        newEntities = language.parser.group('entities').parse(aStream),
        allEntities = option.some(definedEntities.concat(newEntities.orElse([]))),
        nongenerics = entities.nongenerics(allEntities),
        patternNongenerics = entities.patternNongenerics(allEntities),
        substitutions = entities.substitutions(allEntities),
        patternSubstitutions = entities.patternSubstitutions(allEntities),
        environment = entities.environment(allEntities);

    if (!aStream.isEmpty()) {
        console.log("\n#syntax error " + aStream.location());
        return [];
    }

    var freeVariables = list(newEntities.orElse([])).foldL(list(), function (result, entity) {
        return result.append(entities.freeVariables(patternNongenerics, entity));
    }).minus(nongenerics);

    if (!freeVariables.isEmpty()) {
        console.log('found free variables '  + freeVariables.value.join(', '));
        return [];
    }

    var analyse = list(newEntities.orElse([])).foldL(aTry.success(null), function (result, entity) {
        return result.flatmap(function () {
            return entities.analyse(environment, substitutions, patternSubstitutions, entity).map(function (result) {
                var compiledCode = compiler.entity(list(allEntities.get()), entity);
                if (compiledCode.isSuccess()) {
                    eval(compiledCode.success());
                } else {
                    console.log(compiledCode.failure().stack);
                }
                return result;
            });
        });
    });

    if (analyse.isFailure()) {
        console.log(analyse.failure().stack);
    }

    return newEntities.orElse([]);
}

function executeSentence(definedEntities, data) {
    var aStream = stream(data),
        variables = list(definedEntities).map(function (entity) {
            return entities.entityName(entity);
        }),
        expression = language.parser.group('sentence').parse(aStream);

    if (!aStream.isEmpty()) {
        return false;
    }

    var allEntities = option.some(definedEntities),
        nongenerics = entities.nongenerics(allEntities),
        substitutions = entities.substitutions(allEntities),
        environment = entities.environment(allEntities),
        type = expressions.analyse(nongenerics, environment, substitutions, expression.get());
    
    if (type.isFailure()) {
        process.stdout.write(type.failure().toString());
        process.stdout.write('\n');
        return false;
    } 
    
    process.stdout.write("::" + types.substitute(type.success()._1,type.success()._2) + " - ");
        
    var code = compiler.expression(variables,list(),expression.get()).success();
    
    // eta-transformation
    console.log(M.pretty(M.$$(eval("(function(){ return " + code + ";}())"))));
    
    return true;
}

/**
 * Main loop
 */

function endOfSource(line) {
    return line === ';;\n';
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
                types.reset();
                
                if (!executeSentence(allEntities, line)) {
                    allEntities = allEntities.concat(compileSentence(allEntities, line));
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
