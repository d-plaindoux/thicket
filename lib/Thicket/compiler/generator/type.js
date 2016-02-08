/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

/* QUICK AND DIRTY transpiler -- for validation purpose only */

module.exports = (function () {
    
    'use strict';
    
    var symbols = require('../symbols.js');
    
    function compileType(aType) {
        switch (aType.$t) {
            case symbols.TypePolymorphic:
            case symbols.TypeSpecialize:
            case symbols.EntitySpecialization:
                aType.type = compileType(aType.type);
                return aType;
            case symbols.Expression:
                aType.expr = null;
                return aType;
            case symbols.Trait:
            case symbols.Controller:
                aType.behaviors = [];
                return aType;
            default:
                return aType;
        }
    }
    
    function compileEntity(entity) {
        entity.definition = compileType(entity.definition);
        return compileType(entity);
    }
    
    return {
        entity: compileEntity
    };

}());