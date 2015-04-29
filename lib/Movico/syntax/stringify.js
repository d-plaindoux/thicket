/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    function stringify(data) {
        switch (data.$type) {
        case "Module":
            return data.namespace.join('.');
        case "Expression":
            return stringify(data.type);
        case "Model":
        case "Controller":
        case "View":
            if (data.variables.length > 0) {
                return data.name + "[" + data.variables.map(stringify).join(' ') + "]";
            }
            return data.name;
        case "Typedef":
            if (data.variables.length > 0) {
                return data.name + "[" + data.variables.map(stringify).join(' ') + "]";
            }
            return data.name;
        case "TypeRecursive":
            return stringify(data.type);
        case "TypePolymorphic":
            return "[" + data.variables.join(' ') + "] " + stringify(data.type);
        case "TypeSpecialize":
            return data.type + "[" + data.parameters.map(stringify).join(' ') + "]";
        case "TypeNative":
            return data.name;
        case "TypeVariable":
            return data.name;
        case "TypeFunction":
            return "(" + stringify(data.argument) + " -> " + stringify(data.result) + ")";
        default:
            return data;
        }
    }

    return stringify;
}());
 