/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';

    var list = require('../Data/list.js'),
        importgen = require('../Thicket/generator/dependency.js'),
        abstractSyntax = require('../Thicket/generator/code.js'),
        deBruijn = require('../Thicket/generator/deBruijn.js'),
        objcode = require('../Thicket/generator/objcode.js'),
        typegen = require('../Thicket/generator/type.js');
    
    function specification(namespace, dependencies, entities) {
        return {
            namespace: namespace,
            imports: dependencies.map(function(dependency) { 
                return importgen.dependency(dependency); 
            }),
            entities: entities.map(function(entity) { 
                return typegen.entity(entity); 
            })
        };
    }

    function code(namespace, allEntities, entities) {
        var executable = [];
        
        entities.map(function (entity) {
            abstractSyntax.entity(list(allEntities), entity).map(function (syntax) {
                executable = executable.concat(objcode.generateObjCode(deBruijn.indexes(syntax)));
            });
        });

        return {
            namespace: namespace,
            objcode: executable 
        };
    }

    return {
        specification : specification,
        code : code
    };
    
}());
