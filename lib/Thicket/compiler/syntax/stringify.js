/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var symbols = require('../symbols.js');
    
    function stringify(data, paren, full) {
        switch (data.$t) {
            case symbols.Model:
            case symbols.Trait:
            case symbols.Controller:
            case symbols.Typedef:
            case symbols.TypeVariable:
            case symbols.TypeNative:
                if (full && data.namespace) {
                    return "(" + data.name + " from " + data.namespace + ")";
                }
                return data.name;
            case symbols.Expression:
                return stringify(data.type, false, full);        
            case symbols.TypePolymorphic:
                return "[" + data.variables.join(',') + "]" + stringify(data.type, true, full);
            case symbols.EntitySpecialization:
            case symbols.TypeSpecialize:
                return stringify(data.type, false, full) +
                    "[" + data.parameters.map(function(data) { return stringify(data, false, full); }).join(',') + "]";
            case symbols.TypeFunction:
                if (paren) {
                    return "(" + stringify(data.argument, true, full) + " -> " + stringify(data.result, false, full) + ")";
                }                
                return stringify(data.argument, true, full) + " -> " + stringify(data.result, false, full);
            default:
                return JSON.stringify(data, false, full);
        }
    }

    return stringify;
}());
 