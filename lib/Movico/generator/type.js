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
    
    function replacer(key,value)
    {
        if (key === "$location") {
            return undefined;
        } 
        
        return value;
    }
    
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
            case 'View':
                aType.body = [];
                return aType;
            default:
                return aType;
        }
    }
    
    function compileEntity(entity, debug) {
        if (debug) {
            return JSON.stringify(compileType(entity));
        } else {
            return JSON.stringify(compileType(entity), replacer);
        }
    }
    
    return {
        entity: compileEntity
    };

}());