/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

exports.movicoc = (function() {
    var stream = require('../Parser/stream.js').stream,
        option = require('../Data/option.js').option,
        aTry = require('../Data/atry.js').atry,
        list = require('../Data/list.js').list,
        language = require('./language.js').language(),
        types = require('./types.js').types,
        entities = require('./entities.js').entities,
        expressions = require('./expressions.js').expressions,
        compiler = require('./compiler.js').compiler;

    function compileEntities(environment, data) {
        var aStream = stream(data),
            newEntities = language.parser.group('entities').parse(aStream),
            allEntities = option.some(environment.concat(newEntities.orElse([]))),
            nongenerics = entities.nongenerics(allEntities),
            patternNongenerics = entities.patternNongenerics(allEntities),
            substitutions = entities.substitutions(allEntities),
            patternSubstitutions = entities.patternSubstitutions(allEntities),
            newEnvironment = entities.environment(allEntities);

        // Buffer must be consumed
        if (!aStream.isEmpty()) {
            return aTry.failure(new Error("#syntax error " + aStream.location()));
        }

        var freeVariables = list(newEntities.orElse([])).foldL(list(), function (result, entity) {
            return result.append(entities.freeVariables(patternNongenerics, entity));
        }).minus(nongenerics);

        // Free variables must be tracked
        if (!freeVariables.isEmpty()) {
            return aTry.failure(new Error('found free variables '  + freeVariables.value.join(', ')));
        }

        return list(newEntities.orElse([])).foldL(aTry.success(list()), function (result, entity) {
            return result.flatmap(function (result) {
                return entities.analyse(newEnvironment, substitutions, patternSubstitutions, entity).map(function () {
                    return null;
                }).flatmap(function() {
                    return compiler.entity(list(allEntities.get()), entity).map(function(compiledCode) {
                        return result.add([entity, compiledCode]);
                    });
                });
            });
        });
    }

    function compileSentence(environment, data) {
        var aStream = stream(data),
            variables = list(environment).map(function (entity) {
                return entities.entityName(entity);
            }),
            expression = language.parser.group('sentence').parse(aStream);

        // Buffer must be consumed
        if (!aStream.isEmpty()) {
            return aTry.failure([false,new Error("#syntax error " + aStream.location())]);
        }

        var allEntities = option.some(environment),
            nongenerics = entities.nongenerics(allEntities),
            substitutions = entities.substitutions(allEntities),
            newEnvironment = entities.environment(allEntities),
            type = expressions.analyse(nongenerics, newEnvironment, substitutions, expression.get());

        if (type.isFailure()) {
            return aTry.failure([true,type.failure()]);
        } 

        return compiler.sentence(variables,expression.get()).map(function(compiledCode) {            
            return [types.substitute(type.success()._1, type.success()._2), compiledCode];
        });
    }
    
    return { 
        entities: compileEntities,
        sentence: compileSentence
    };

}());
