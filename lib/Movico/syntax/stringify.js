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
            return data.name;
        case "Typedef":
            if (data.variables.length > 0) {
                return data.name + "[" + data.variables.map(stringify).join(' ') + "]";
            }
            return data.name;
        case "Model":
            if (data.variables.length > 0) {
                return data.name + "[" + data.variables.map(stringify).join(' ') + "]";
            }
            return data.name;
        case "TypeRecursive":
            return data.type.toString();
        case "TypePolymorphic":
            switch (data.type.$type) {
                case 'Model':
                case 'Controller':
                case 'View':
                    return data.type.name;            
                default:
                    return "[" + data.variables.join(' ') + "] " + stringify(data.type);
            }
            break;
        case "TypeSpecialize":
            return data.type + "[" + data.parameters.map(stringify).join(' ') + "]";
        case "TypeNative":
            return data.name;
        case "TypeVariable":
            return data.name;
        case "TypeFunction":
            return "(" + stringify(data.argument) + " -> " + stringify(data.result) + ")";
        case "Controller":
            if (data.variables.length > 0) {
                return data.name + "[" + data.variables.map(stringify).join(' ') + "]";
            }
            return data.name;
        case "View":
            if (data.variables.length > 0) {
                return data.name + "[" + data.variables.map(stringify).join(' ') + "]";
            }
            return data.name;
        default:
            return data;
        }
    }

    return stringify;
}());
 