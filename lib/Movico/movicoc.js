/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

module.exports = (function() {
    var stream = require('../Parser/stream.js'),
        option = require('../Data/option.js'),
        aTry = require('../Data/atry.js'),
        list = require('../Data/list.js'),
        language = require('./syntax/language.js')(),
        builder = require('./checker/builder.js'),
        types = require('./checker/types.js'),
        entities = require('./checker/entities.js'),
        expressions = require('./checker/expressions.js'),
        compiler = require('./compiler/codegen.js');

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
                        return result.add({ 
                            entity : entity, 
                            code : compiledCode
                        });
                    });
                });
            });
        });
    }

    function compileSentence(environment, data) {
        var aStream = stream(data),
            variables = list(environment).map(function (entity) {
                return builder.entityName(entity);
            }),
            expression = language.parser.group('sentence').parse(aStream);

        // Buffer must be consumed
        if (!aStream.isEmpty()) {
            return aTry.failure({ 
                checked : false, 
                error : new Error("#syntax error " + aStream.location()) 
            });
        }

        var allEntities = option.some(environment),
            nongenerics = entities.nongenerics(allEntities),
            substitutions = entities.substitutions(allEntities),
            newEnvironment = entities.environment(allEntities),
            type = expressions.analyse(nongenerics, newEnvironment, substitutions, expression.get());

        if (type.isFailure()) {
            return aTry.failure({ 
                checked : true, 
                error : type.failure()
            });
        } 

        return compiler.sentence(variables,expression.get()).map(function(compiledCode) {            
            return { 
                type : types.substitute(type.success()._1, type.success()._2),  
                code : compiledCode 
            };
        });
    }
    
    return { 
        entities: compileEntities,
        sentence: compileSentence
    };

}());
