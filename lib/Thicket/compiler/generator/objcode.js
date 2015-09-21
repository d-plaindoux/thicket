/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var $i = require('../../runtime/instruction.js');
    
    function objCode(code) {
        switch (code.$t) {
            case "Native":
                return [[ $i.CONST, code.$values[0] ]];
            case "Ident":
                return [[ $i.IDENT, code.$values[0] ]];
            case "Variable":    
                return [[ $i.ACCESS, code.$values[0] ]];
            case "Apply":
                return objCode(code.$values[0]).concat(objCode(code.$values[1])).concat([[ $i.APPLY ]]);
            case "Invoke":
                return objCode(code.$values[0]).concat([[ $i.INVOKE, code.$values[1]] ]);
            case "Function":
                return [[ $i.CLOSURE, objCodeTail(code.$values[0]) ]];
            case "Lazy":
                return [[ $i.PUSH, objCode(code.$values[0]) ]];
            case "Model":
                return [[ 
                    $i.MODEL, [
                        code.$values[0],
                        code.$values[1].map(function (code) {                            
                            return [ code[0], objCodeTail(code[1]) ]; 
                        })
                    ]
                ]];
            case "Trait":
            case "Controller":
                return [[
                    $i.CLASS, [
                        code.$values[0],
                        code.$values[1].map(function (code) {
                            return [ code[0], objCodeTail(code[1]) ]; 
                        }),
                        code.$values[2]                    
                    ]
                ]];
            case "Definition":
                return [[ 
                    $i.DEFINITION, [
                        code.$values[0],
                        objCode(code.$values[1])
                    ]
                ]];
            case "Alter":
                return objCode(code.$values[0]).concat(objCode(code.$values[2])).concat([[ $i.ALTER, code.$values[1] ]]);
            default:
                throw new Error("Illegal argument " + code.$t);
        }
    }

    function objCodeTail(code) {
        switch (code.$t) {
            case "Apply":
                return objCode(code.$values[0]).concat(objCode(code.$values[1])).concat([[ $i.TAILAPPLY ]]);
            case "Invoke":
                return objCode(code.$values[0]).concat([[ $i.TAILINVOKE, code.$values[1] ]]);
            default:
                return objCode(code).concat([[ $i.RETURN ]]);
        }
    }

    return {
        generateObjCode: objCode
    };
}());