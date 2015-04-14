/*global JSON*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

/* QUICK AND DIRTY transpiler -- for validation purpose only */

module.exports = (function () {
    
    'use strict';
    
    var reflect = require('../../Data/reflect.js');
        // builder = require('../checker/builder.js');

    function replacer(key,value)
    {
        if (key === "$location") {
            return undefined;
        }
        
        return value;
    }
    
    function compileType(aType) {
        switch (reflect.typeof(aType)) {
            case 'TypePolymorphic':
                aType.type = compileType(aType.type);
                return aType;
            case 'Expression':
                aType.expr = null;
                return aType;
            case 'Controller':                                
                aType.behaviors = [];
                return aType;
            case 'View':
                aType.body = [];
                return aType;
            default:
                return aType;
        }
    }
    
    function compileImport(anImport) {
        return JSON.stringify(anImport, replacer);
    }
    
    function compileEntity(entity) {
        return JSON.stringify(compileType(entity), replacer);
    }
    
    return {
        dependency: compileImport,
        entity: compileEntity
    };

}());