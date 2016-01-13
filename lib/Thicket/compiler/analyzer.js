/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

module.exports = (function () {
    
    var stream = require('../../Parser/stream.js'),
        aTry = require('../../Data/atry.js'),
        list = require('../../Data/list.js'),    
        language = require('./syntax/language.js')().locate(),
        types = require('./checker/types.js'),
        entities = require('./checker/entities.js'),
        expressions = require('./checker/expressions.js');
    
    function analyze(entry, data, filename) {
        var aStream = stream(data, filename),
            sourcesOrNothing = language.parser.group(entry).parse(aStream);
        
        // Buffer must be consumed
        if (!aStream.isEmpty()) {
            return aTry.failure(new Error("syntax error " + aStream.location()));
        } else {        
            return aTry.success(sourcesOrNothing);
        }
    }
    
    function analyzeModule(data, filename) {
        return analyze('module', data, filename).map(function (moduleOrNothing) {
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
            var name = anImport.namespace;
        
            try {
                if (!packages.contains(name)) {
                    var code = reader.specification(name);                    
                    packages.define(code);
                    analyzeImports(packages, reader, code.imports);
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
        
        return expressions.analyse(list(), environment, expression).map(function(type) {
            var result = types.substitute(type._1, type._2);

            types.reset();
            
            return aTry.success({ 
                type : types.fresh(types.generalize(types.reduce(result,true).recoverWith(result))), 
                expr : expression, 
            });
        });
    }
    
    return { 
        module: analyzeModule,
        imports: analyzeImports,
        source: analyzeSource,
        entities: compileEntities,
        sentence: compileSentence
    };

}());
