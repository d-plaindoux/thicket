/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';

    var $i = require('./instruction.js');
    
    function pretty(code) {
        switch ($i.get(code)) {
            case $i.code.ENV:
                return "<function>";
            case $i.code.OBJ:
                var type  = code[1][0][0],
                    name  = code[1][0][1][0];

                switch (name) {
                    case "unit":
                        return "()";
                    case "number":
                        return code[1][1][1];
                    case "char":
                        return "'" + code[1][1][1].replace(/'/g,"\\'") + "'";
                    case "string":                    
                        return '"' + code[1][1][1].replace(/"/g,'\\"') + '"';
                    default:
                        return "<" + (type === $i.code.MODEL ? "model" : "class") + " " + name + ">";
                }
                        
                break;
            case $i.code.CONST:
                return JSON.stringify(code[1]);
            default:
                return JSON.stringify(code);
        }
    }
    
    return pretty;
}());
 