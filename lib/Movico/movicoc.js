/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

module.exports = (function () {
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
    
    function analyze(entry, data) {
        var aStream = stream(data),
            sourcesOrNothing = language.parser.group(entry).parse(aStream);
        
        // Buffer must be consumed
        if (!aStream.isEmpty()) {
            return aTry.failure(new Error("#syntax error " + aStream.location()));
        } else {        
            return aTry.success(sourcesOrNothing);
        }
    }
    
    function analyzeModule(data) {
        return analyze('source', data).map(function (sourcesOrNothing) {
            return sourcesOrNothing.orElse([[],[]]);
        });
    }

    function analyzeSource(data) {
        return analyze('source', data).map(function (sourcesOrNothing) {
            return sourcesOrNothing.orElse([[],[]]);
        });
    }

    function compileSource(environment, newEntities) {
        var allEntities = option.some(environment.concat(newEntities)),
            nongenerics = entities.nongenerics(allEntities),
            patternNongenerics = entities.patternNongenerics(allEntities),
            substitutions = entities.substitutions(allEntities),
            patternSubstitutions = entities.patternSubstitutions(allEntities),
            newEnvironment = entities.environment(allEntities);
        
        var freeVariables = list(newEntities).foldL(list(), function (result, entity) {
            return result.append(entities.freeVariables(patternNongenerics, entity));
        }).minus(nongenerics);

        // Free variables must be tracked
        if (!freeVariables.isEmpty()) {
            return aTry.failure(new Error('found free variables '  + freeVariables.value.join(', ')));
        }

        // Compile all new entities
        return list(newEntities).foldL(aTry.success(list()), function (result, entity) {
            return result.flatmap(function (result) {
                return entities.analyse(newEnvironment, substitutions, patternSubstitutions, entity).map(function () {
                    return null;
                }).flatmap(function() {
                    return compiler.entity(list(allEntities.get()), entity).map(function(compiledCode) {
                        if (compiledCode) {
                            return result.add({ 
                                entity : entity, 
                                code : compiledCode
                            });
                        } else {
                            return result;
                        }
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
        module : analyzeModule,
        source : analyzeSource,
        entities: compileSource,
        sentence: compileSentence
    };

}());
