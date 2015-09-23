/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';

    var codegen = require('./generator/code.js'),
        deBruijn = require('./generator/deBruijn.js'),
        objcode = require('./generator/objcode.js'),
        typegen = require('./generator/type.js');

    function code(namespace, environment, dependencies, entities, sentences) {
        var definitions = [],
            executable = [];
        
        entities.map(function (entity) {
            codegen.entity(environment, entity.definition).map(function (syntax) {
                definitions = definitions.concat(objcode.generateObjCode(deBruijn.indexes(syntax)));
            });
        });

        sentences.map(function (sentence) {
            codegen.sentence(sentence.definition).map(function (syntax) {
                executable = executable.concat([objcode.generateObjCode(deBruijn.indexes(syntax))]);
            });
        });

        return {
            namespace: namespace,
            imports: dependencies,
            entities: entities.map(function(entity) { 
                return typegen.entity(entity); 
            }),
            objcode: definitions,
            main: executable
        };
    }

    return {
        code : code
    };
    
}());
