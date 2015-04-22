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
        language = require('./syntax/language.js')().locate(),
        types = require('./checker/types.js'),
        entities = require('./checker/entities.js'),
        expressions = require('./checker/expressions.js');    
    
    function analyze(entry, data) {
        var aStream = stream(data),
            sourcesOrNothing = language.parser.group(entry).parse(aStream);
        
        // Buffer must be consumed
        if (!aStream.isEmpty()) {
            return aTry.failure(new Error("syntax error " + aStream.location()));
        } else {        
            return aTry.success(sourcesOrNothing);
        }
    }
    
    function analyzeModule(data) {
        return analyze('module', data).map(function (sourcesOrNothing) {
            return sourcesOrNothing.map(function (aModule) {
                return [aModule.namespace, [aModule.imports, aModule.entities]];
            }).orElse([[],[]]);
        });
    }

    function analyzeSource(data) {
        return analyze('source', data).map(function (sourcesOrNothing) {
            return sourcesOrNothing.orElse([[],[]]);
        });
    }
    
    // QUICK HACK !!
    function analyzeImports(readSpecifications, readDependencies, imports, imported) {
        var newEnvironment = [], newImported = imported || {};
        
        imports.forEach(function(anImport) {
            var name = anImport.namespace.join(".");
            option.some(newImported[name]).orLazyElse(function () {
                var entities = readSpecifications(anImport.namespace.join("."));
                newEnvironment = newEnvironment.concat(entities);
                newImported[anImport.namespace.join(".")] = true;
            });
        });
        
        imports.forEach(function(anImport) {
            var entities = analyzeImports(readSpecifications, 
                                          readDependencies, 
                                          readDependencies(anImport.namespace.join(".")),
                                          newImported);
            
            newEnvironment = newEnvironment.concat(entities);
        });
        
        return newEnvironment;
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
            return aTry.failure(new Error('found free type variables '  + freeVariables.value.join(', ')));
        }

        // Compile all new entities
        return entities.analyse(nongenerics, newEnvironment, substitutions, patternSubstitutions, newEntities);
    }

    function compileSentence(environment, data) {
        var aStream = stream(data),
            expression = language.parser.group('sentence').parse(aStream);

        // Buffer must be consumed
        if (!aStream.isEmpty() || !expression.isPresent()) {
            return option.none();
        }

        var allEntities = option.some(environment),
            nongenerics = entities.nongenerics(allEntities),
            substitutions = entities.substitutions(allEntities),
            newEnvironment = entities.environment(allEntities),
            type = expressions.analyse(nongenerics, newEnvironment, substitutions, expression.get());

        if (type.isFailure()) {
            return option.some(type);
        } else {
            var result = types.substitute(type.success()._1, type.success()._2);

            return option.some(aTry.success({ 
                type : types.generalize(types.reduce(result).recoverWith(result)),  
                expr : expression.get(), 
            }));
        }
    }
    
    return { 
        module: analyzeModule,
        imports: analyzeImports,
        source: analyzeSource,
        entities: compileSource,
        sentence: compileSentence
    };

}());
