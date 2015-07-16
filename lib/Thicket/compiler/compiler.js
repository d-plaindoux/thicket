/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';

    var list = require('../../Data/list.js'),
        codegen = require('./generator/code.js'),
        deBruijn = require('./generator/deBruijn.js'),
        objcode = require('./generator/objcode.js'),
        typegen = require('./generator/type.js');
    
    function specification(namespace, dependencies, entities) {
        return {
            namespace: namespace,
            imports: dependencies,
            entities: entities.map(function(entity) { 
                return typegen.entity(entity); 
            })
        };
    }

    function code(namespace, entities) {
        var executable = [];
        
        entities.map(function (entity) {
            codegen.entity(list(), entity).map(function (syntax) {
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
