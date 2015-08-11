/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
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
            case "Lazy":
                return [{ PUSH : objCode(code.$values[0]) }];
            case "Model":
                return [{ 
                    MODEL : [
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
                            return [ code[0], objCodeTail(code[1]) ]; 
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
            case "Invoke":
                return objCode(code.$values[0]).concat([{TAILINVOKE:code.$values[1]}]);
            default:
                return objCode(code).concat([{RETURN:1}]);
        }
    }

    return {
        generateObjCode: objCode
    };
}());