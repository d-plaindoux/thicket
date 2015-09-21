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
        switch (aType.$t) {
            case 'TypePolymorphic':
            case 'TypeSpecialize':
            case 'EntitySpecialization':
                aType.type = compileType(aType.type);
                return aType;
            case 'Expression':
                aType.expr = null;
                return aType;
            case 'Trait':
            case 'Controller':                                
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