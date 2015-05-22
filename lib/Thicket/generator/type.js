/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

/* QUICK AND DIRTY transpiler -- for validation purpose only */

module.exports = (function () {
    
    'use strict';
    
    function compileType(aType) {
        switch (aType.$type) {
            case 'TypePolymorphic':
                aType.type = compileType(aType.type);
                return aType;
            case 'Expression':
                aType.expr = null;
                return aType;
            case 'Controller':                                
                aType.behaviors = [];
                return aType;
            default:
                return aType;
        }
    }
    
    function compileEntity(entity) {
        return compileType(entity);
    }
    
    return {
        entity: compileEntity
    };

}());