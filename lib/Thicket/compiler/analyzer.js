/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

module.exports = (function () {
    
    var stream = require('../../Parser/stream.js'),
        option = require('../../Data/option.js'),
        aTry = require('../../Data/atry.js'),
        list = require('../../Data/list.js'),    
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
        return analyze('module', data).map(function (moduleOrNothing) {
            return moduleOrNothing.get();
        });
    }

    function analyzeSource(data) {
        return analyze('source', data).map(function (sourcesOrNothing) {
            return sourcesOrNothing.orElse([[],[],[]]);
        });
    }
    
    function analyzeImports(packages, reader, imports) {
        imports.forEach(function(anImport) {
            var name = anImport.namespace.join(".");
            try {
                if (!packages.contains(name)) {
                    var specifications = reader.specifications(name);
                    packages.define(specifications);
                    analyzeImports(packages, reader, specifications.imports);
                }
            } catch (e) {                
                console.log("While loading " + name + ": " + e);
            }
        });
    }

    function compileEntities(environment, newEntities) {
        return entities.analyse(environment, newEntities);
    }

    function compileSentence(environment, expression) {
        types.reset();
        
        var type = expressions.analyse(list(), environment, expression);
        
        if (type.isFailure()) {
            return option.some(type);
        } else {
            var result = types.substitute(type.success()._1, type.success()._2);

            types.reset();
            
            return option.some(aTry.success({ 
                type : types.fresh(types.generalize(types.reduce(result).recoverWith(result))), 
                expr : expression, 
            }));
        }
    }
    
    return { 
        module: analyzeModule,
        imports: analyzeImports,
        source: analyzeSource,
        entities: compileEntities,
        sentence: compileSentence
    };

}());
