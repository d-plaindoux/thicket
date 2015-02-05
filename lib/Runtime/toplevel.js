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

// Extend String 
String.prototype.endsWith = function (s) {
  return this.length >= s.length && this.substr(this.length - s.length) === s;
};

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
        return aTry.failure(new Error("#syntax error " + aStream.location()));
    }

    var freeVariables = list(newEntities.orElse([])).foldL(list(), function (result, entity) {
        return result.append(entities.freeVariables(patternNongenerics, entity));
    }).minus(nongenerics);

    if (!freeVariables.isEmpty()) {
        return aTry.failure(new Error('found free variables '  + freeVariables.value.join(', ')));
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

    return aTry.success(newEntities.orElse([]));
}

function executeSentence(definedEntities, data) {
    var aStream = stream(data),
        variables = list(definedEntities).map(function (entity) {
            return entities.entityName(entity);
        }),
        expression = language.parser.group('sentence').parse(aStream);

    if (!aStream.isEmpty()) {
        return aTry.failure([false,new Error("#syntax error " + aStream.location())]);
    }

    var allEntities = option.some(definedEntities),
        nongenerics = entities.nongenerics(allEntities),
        substitutions = entities.substitutions(allEntities),
        environment = entities.environment(allEntities),
        type = expressions.analyse(nongenerics, environment, substitutions, expression.get());
    
    if (type.isFailure()) {
        return aTry.failure([true,type.failure()]);
    } 
    
    process.stdout.write(types.substitute(type.success()._1,type.success()._2) + " :: ");
        
    var code = compiler.expression(variables,list(),expression.get()).success();
    
    // eta-conversion
    return aTry.success(M.$$(eval("(function(){return " + code + ";}())")));
}

/**
 * Main loop
 */

function endOfSource(line) {
    return line.replace(/\s*$/, '').endsWith(';;');
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
                
                line += chunk.toString().replace(/;;\n$/,'');
                
                var execution = executeSentence(allEntities, line);
                
                if (execution.isFailure()) {                    
                    if (execution.failure()[0]) {
                        console.log(execution.failure()[1]);
                    } else {
                        var newEntities = compileSentence(allEntities, line);
                        if (newEntities.isSuccess()) {
                            allEntities = allEntities.concat(newEntities.success());
                        } else {
                            console.log(newEntities.failure());
                        }
                    }
                } else {
                    console.log(M.pretty(execution.success()));
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
