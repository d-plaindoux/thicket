/*global exports*/ //, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.types = (function () {
    
    'use strict';
    
    var type = require('../Data/type.js').type;
    
    function typeFreeVariables(aType, variables) {
        switch (type.get(aType)) {
            case 'TypePolymorphic':
                variables = typeFreeVariables(aType.type, variables);
                return variables.filter(function (name) {
                    return name !== aType.variable;
                });
            case 'TypeNative':
                return variables;
            case 'TypeVariable':
                return variables.concat([ aType.name ]);
            case 'TypeArray':
                return typeFreeVariables(aType.type, variables);
            case 'TypeFunction':
                return typeFreeVariables(aType.result, typeFreeVariables(aType.argument, variables));
            case 'TypePair':
                return typeFreeVariables(aType.second, typeFreeVariables(aType.first, variables));
            default:
                return variables;
        }
    }

    return {
        freeVariables : function (aType) { 
            return typeFreeVariables(aType, []);
        }
    };
}());
    
    