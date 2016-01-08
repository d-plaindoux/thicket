/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    function stringify(data, paren, full) {
        switch (data.$t) {
            case "Model":
            case "Trait":
            case "Controller":
            case "Typedef":
            case "TypeVariable":
            case "TypeNative":
                if (full && data.namespace) {
                    return "(" + data.name + " from " + data.namespace + ")";
                }
                return data.name;
            case "Expression":
                return stringify(data.type, false, full);        
            case "TypePolymorphic":
                return "[" + data.variables.join(' ') + "]" + stringify(data.type, true, full);
            case 'EntitySpecialization':
            case "TypeSpecialize":
                return stringify(data.type, false, full) +
                    "[" + data.parameters.map(function(data) { return stringify(data, false, full); }).join(' ') + "]";
            case "TypeFunction":
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
 