/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';

    function expandSubstitution(substitutions, name, indice) {
        var newSubstitutions = {};
        for (var i in substitutions) {
            newSubstitutions[i] = substitutions[i];
        }
        newSubstitutions[name] = indice;
        return newSubstitutions;
    }
    
    function deBruinjIndexes(indice, code, substitutions) {
        var newSubstitutions;
        
        switch (code.$t) {
            case "Native":
            case "Ident":
                return code;
            case "Variable":    
                return { 
                    $t : code.$t, 
                    $values : [ substitutions[code.$values[0]] ] 
                };
            case "Apply":
                return { 
                    $t : code.$t, 
                    $values : [ 
                        deBruinjIndexes(indice, code.$values[0], substitutions), 
                        deBruinjIndexes(indice, code.$values[1], substitutions) 
                    ]
                };
            case "Invoke":
                return { 
                    $t : code.$t, 
                    $values : [ deBruinjIndexes(indice, code.$values[0], substitutions), code.$values[1] ]
                };
            case "Function":
                newSubstitutions = expandSubstitution(substitutions, code.$values[0], indice+1);

                return { 
                    $t : code.$t,
                    $values : [ deBruinjIndexes(indice + 1, code.$values[1], newSubstitutions) ]
                };
            case "Lazy":
                return {
                    $t : code.$t,
                    $values : [ deBruinjIndexes(indice, code.$values[0], substitutions) ]
                };
            case "Model":
                return {
                    $t : code.$t,
                    $values : [
                        code.$values[0],
                        code.$values[1].map(function (name,i) {                            
                            return [ name, { $t : "Variable", $values : [ indice + (i + 1) ] } ]; 
                        })
                    ]
                };
            case "Trait":
                newSubstitutions = expandSubstitution(newSubstitutions, "self", indice+2);

                return {
                    $t : code.$t,
                    $values : [
                        code.$values[0],
                        code.$values[1].map(function (code) {                            
                            return [ code[0], deBruinjIndexes(indice+2, code[1] , newSubstitutions) ]; 
                        }),
                        code.$values[2]
                    ]
                };
            case "Controller":
                newSubstitutions = expandSubstitution(substitutions, code.$values[1], indice+1);
                newSubstitutions = expandSubstitution(newSubstitutions, "self", indice+2);

                return {
                    $t : code.$t,
                    $values : [
                        code.$values[0],
                        code.$values[2].map(function (code) {                            
                            return [ code[0], deBruinjIndexes(indice+2, code[1] , newSubstitutions) ]; 
                        }),
                        code.$values[3]
                    ]
                };
            case "Definition":
                return {
                    $t : code.$t,
                    $values : [
                        code.$values[0],
                        deBruinjIndexes(indice, code.$values[1], substitutions)
                    ]
                }; 
            case "Alter":
                return {
                    $t : code.$t,
                    $values : [
                        deBruinjIndexes(indice, code.$values[0], substitutions),
                        code.$values[1],
                        deBruinjIndexes(indice, code.$values[2], substitutions)
                    ]
                };                 
            default:
                return code;
        }
    }

    return {
        indexes : function(code) { return deBruinjIndexes(0, code, []); }
    };
}());