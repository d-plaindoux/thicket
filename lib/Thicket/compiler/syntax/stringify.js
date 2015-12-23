/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    function stringify(data, paren) {
        switch (data.$t) {
            case 'EntitySpecialization':
                return stringify(data.type) + "[" + data.parameters.map(stringify).join(' ') + "]";
            case "Model":
            case "Trait":
            case "Controller":
            case "Typedef":
                return data.name;
            case "Expression":
                return stringify(data.type);        
            case "TypePolymorphic":
                return "[" + data.variables.join(' ') + "]" + stringify(data.type, true);
            case "TypeSpecialize":
                return stringify(data.type) + "[" + data.parameters.map(stringify).join(' ') + "]";
            case "TypeNative":
                return data.name;
            case "TypeVariable":
                return data.name;
            case "TypeFunction":
                if (paren) {
                    return "(" + stringify(data.argument, true) + " -> " + stringify(data.result) + ")";
                }                
                return stringify(data.argument, true) + " -> " + stringify(data.result);
            default:
                return JSON.stringify(data);
        }
    }

    return stringify;
}());
 