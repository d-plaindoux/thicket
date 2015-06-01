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
                return {
                    $type : code.$type,
                    $values : [ 
                        deBruinjIndex(indice, code.$values[0], substitutions),
                        code.$values[1].map(function (att) {
                            return [deBruinjIndex(indice, att[0], substitutions), 
                                    deBruinjIndex(indice, att[1], substitutions)];
                        }),
                        code.$values[2].map(function (code) {
                            return deBruinjIndex(indice, code, substitutions);
                        })                        
                    ]
                };
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
            case "Definition":
                return {
                    $type : code.$type,
                    $values : [
                        code.$values[0],
                        deBruinjIndex(indice, code.$values[1], substitutions)
                    ]
                }; 
            case "Alter":
                return {
                    $type : code.$type,
                    $values : [
                        deBruinjIndex(indice, code.$values[0], substitutions),
                        code.$values[1],
                        deBruinjIndex(indice, code.$values[2], substitutions)
                    ]
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
                return objCode(code.$values[0]).concat(objCode(code.$values[1])).concat([{ APPLY : 1 }]);
            case "Invoke":
                return objCode(code.$values[0]).concat([{INVOKE:code.$values[1]}]);
            case "Function":
                return [{ CLOSURE : objCodeTail(code.$values[0]) }];
            case "Tag":
                var result = [{ IDENT : "document" } ].
                            concat(objCode(code.$values[0])).
                            concat([{ APPLY : 1 },{ INVOKE : "create" }]);
                
                // Attributes
                code.$values[1].forEach(function (att) {
                    result = result.concat([{ INVOKE : "addAttribute" }]).
                            concat(objCode(att[0])).concat([{ APPLY : 1 }]).
                            concat(objCode(att[1])).concat([{ APPLY : 1 }]);
                });
                
                // Content
                code.$values[2].forEach(function (code) {
                    result = result.concat([{ INVOKE : "addChild" }]).
                            concat(objCode(code).concat([{ APPLY : 1 }]));
                });                            
                
                return result;
            case "Lazy":
                return [{ LAZY : objCode(code.$values[0]) }];
            case "Model":
                return [{ MODEL : [
                        code.$values[0],
                        code.$values[1].map(function (code) {                            
                            return [ code[0], objCodeTail(code[1]) ]; 
                        })
                    ]
                }];
            case "Controller":
                return [{
                    CLASS : [
                        code.$values[0],
                        code.$values[1].map(function (code) {
                            if (code[1].$type === "Function") {
                                return [ code[0], objCodeTail(code[1]) ]; 
                            } else {
                                return [ code[0], objCodeTail(code[1]) ]; 
                            }
                        })
                    ]
                }];
            case "Definition":
                return [{ 
                    DEFINITION : [
                        code.$values[0],
                        objCode(code.$values[1])
                    ]
                }];
            case "Alter":
                return objCode(code.$values[0]).concat(objCode(code.$values[2])).concat([{ ALTER : code.$values[1] }]);
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