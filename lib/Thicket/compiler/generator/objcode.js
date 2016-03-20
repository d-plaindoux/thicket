/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var $i = require('../../runtime/instruction.js');
        
    function objCode(code) {
        switch (code.$t) {
            case "Native":
                return [[ 
                    $i.code.CONST, 
                    code.$values[0]
                ]];
            case "Ident":
                return [[ 
                    $i.code.IDENT, 
                    code.$values[0] 
                ]];
            case "Variable":    
                return [[ 
                    $i.code.ACCESS,
                    code.$values[0] 
                ]];
            case "Apply":
                return objCode(code.$values[0]).
                    concat([ $i.code.EVAL ]).
                    concat(objCode(code.$values[1])).
                    concat([ $i.code.APPLY ]);
            case "Invoke":
                return objCode(code.$values[0]).
                    concat([ $i.code.EVAL ]).
                    concat([[ $i.code.INVOKE, code.$values[1]] ]);
            case "Function":
                return [[ 
                    $i.code.CLOSURE, 
                    objCodeTail(code.$values[0]) 
                ]];
            case "Lazy":
                return [[ 
                    $i.code.PUSH, 
                    objCode(code.$values[0]) 
                ]];
            case "Model":
                return [[ 
                    $i.code.MODEL, [
                        code.$values[0],
                        code.$values[1].map(function (code) {                            
                            return [ code[0], objCodeTail(code[1]) ]; 
                        })
                    ]
                ]];
            case "Trait":
            case "Controller":
                return [[
                    $i.code.CLASS, [
                        code.$values[0],
                        code.$values[1].map(function (code) {
                            return [ code[0] ? code[0] + "." + code[1] : code[1] , objCodeTail(code[2]) ]; 
                        }),
                        code.$values[2]                    
                    ]
                ]];
            case "Definition":
                return [[ 
                    $i.code.DEFINITION, [
                        code.$values[0],
                        objCodeTail(code.$values[1])
                    ]
                ]];
            case "Alter":
                return objCode(code.$values[0]).
                    concat([ $i.code.EVAL ]).
                    concat(objCode(code.$values[2])).
                    concat([ $i.code.EVAL ]).
                    concat([[ $i.code.ALTER, code.$values[1] ]]);
            default:
                throw new Error("Illegal argument " + code.$t);
        }
    }

    function objCodeTail(code) {
        switch (code.$t) {
            case "Apply":
                return objCode(code.$values[0]).
                    concat([ $i.code.EVAL ]).
                    concat(objCode(code.$values[1])).
                    concat([ $i.code.TAILAPPLY ]);
            case "Invoke":
                return objCode(code.$values[0]).
                    concat([ $i.code.EVAL ]).
                    concat([[ $i.code.TAILINVOKE, code.$values[1] ]]);
            default:
                return objCode(code).
                    concat([ $i.code.RETURN ]);
        }
    }

    return {
        generateObjCode: objCode
    };
}());