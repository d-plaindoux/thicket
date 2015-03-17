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
/*    
    var reflect  = require('../../Data/reflect.js'),
        types    = require('../checker/types.js'),
        entities = require('../checker/entities.js');
*/
    function compileType(entity) {
        return entity;
    }
    
    function compileEntity(entity) {
        return compileType(entity);
    }
    
    return {
        entity: compileEntity
    };

}());