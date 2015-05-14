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
    
    function deBruinjIndex(indice, code, substitutions) {
        var newSubstitutions;
        
        switch (code.$type) {
            case "Native":
            case "Ident":
                return code;
            case "Variable":    
                return { 
                    $type : code.$type, 
                    $values : [ substitutions[code.$values[0]] ] 
                };
            case "Apply":
                return { 
                    $type : code.$type, 
                    $values : [ 
                        deBruinjIndex(indice, code.$values[0], substitutions), 
                        deBruinjIndex(indice, code.$values[1], substitutions) 
                    ]
                };
            case "Invoke":
                return { 
                    $type : code.$type, 
                    $values : [ deBruinjIndex(indice, code.$values[0], substitutions), code.$values[1] ]
                };
            case "Function":
                newSubstitutions = expandSubstitution(substitutions, code.$values[0], indice+1);

                return { 
                    $type : code.$type,
                    $values : [ deBruinjIndex(indice + 1, code.$values[1], newSubstitutions) ]
                };
            case "Tag":
                
                return code; // TODO
            case "Lazy":
                return {
                    $type : code.$type,
                    $values : [ deBruinjIndex(indice, code.$values[0], substitutions) ]
                };
            case "Model":
                return {
                    $type : code.$type,
                    $values : [
                        code.$values[0],
                        code.$values[1].map(function (name,i) {                            
                            return [ name, { $type : "Variable", $values : [ indice + (i + 1) ] } ]; 
                        })
                    ]
                };
            case "Controller":
                newSubstitutions = expandSubstitution(substitutions, code.$values[1], indice+1);
                newSubstitutions = expandSubstitution(newSubstitutions, "self", indice+2);

                return {
                    $type : code.$type,
                    $values : [
                        code.$values[0],
                        code.$values[2].map(function (code) {                            
                            return [ code[0], deBruinjIndex(indice+2, code[1] , newSubstitutions) ]; 
                        })
                    ]
                };
            case "View": 
                newSubstitutions = expandSubstitution(substitutions, code.$values[1], indice+1);

                return {
                    $type : code.$type,
                    $values : [
                        code.$values[0],
                        code.$values[2].map(function (code) {                            
                            return deBruinjIndex(indice+1, code , newSubstitutions); 
                        })
                    ]
                };
            case "Definition":
                return {
                    $type : code.$type,
                    $values : code.$values.map(function(code, i) { 
                        if (i < 1) {
                            return code;
                        } else {
                            return deBruinjIndex(indice, code, substitutions); 
                        }
                    }) 
                };  
            default:
                return code;
        }
    }
    
    function objCode(code) {
        switch (code.$type) {
            case "Native":
                return [{ CONST : code.$values[0] }];
            case "Ident":
                return [{ IDENT : code.$values[0] }];
            case "Variable":    
                return [{ ACCESS : code.$values[0] }];
            case "Apply":
                return objCode(code.$values[0]).concat(objCode(code.$values[1])).concat([{APPLY:1}]);
            case "Invoke":
                return objCode(code.$values[0]).concat([{INVOKE:code.$values[1]}]);
            case "Function":
                return [{ CLOSURE : objCodeTail(code.$values[0]) }];
            case "Tag":
                return [{ TAG: code }];
            case "Lazy":
                return [{ LAZY : objCode(code.$values[0]) }];
            case "Model":
                return [{ MODEL : [
                        code.$values[0],
                        code.$values[1].map(function (code) {                            
                            return [ code[0], objCode(code[1]).concat({RETURN:1}) ]; 
                        })
                    ]
                }];
            case "Controller":
                return [{
                    CLASS : [
                        code.$values[0],
                        code.$values[1].map(function (code) {                            
                            return [ code[0], objCode(code[1]) ]; 
                        })
                    ]
                }];
            case "View": 
                return [{ 
                    VIEW : code.$values.map(function(code, i) { 
                        if (i < 1) {
                            return code;
                        } else {
                            return code.map(function(code) { 
                                return objCode(code);
                            });
                        }
                    }) 
                }];      
            case "Definition":
                return [{ 
                    DEFINITION : code.$values.map(function(code, i) { 
                        if (i < 1) {
                            return code;
                        } else {
                            return objCode(code);
                        }
                    }) 
                }];
            default:
                throw new Error("Illegal argument " + JSON.stringify(code));
        }
    }

    function objCodeTail(code) {
        switch (code.$type) {
            case "Apply":
                return objCode(code.$values[0]).concat(objCode(code.$values[1])).concat([{TAILAPPLY:1}]);
            default:
                return objCode(code).concat([{RETURN:1}]);
        }
    }

    return {
        deBruijnIndex : function(code) { return deBruinjIndex(0, code, []); },
        generateObjCode: objCode,
    };
}());