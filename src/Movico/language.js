/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.language = (function () {
    
    'use strict';
    
    var parser = require('../Analyser/parser.js').parser,
        bind = require('../Analyser/bind.js').bind;
    
    /*
       MovicoJS grammar definition   

        entity  ::= modelDef | classDef | viewDef

        modelDef  ::= "model" IDENT "{" param* "}"
        param     ::= IDENT ":" type

        type      ::= IDENT | "(" types ")" | "[" type "]"
        types     ::= type ("," type)*

        // ----------------------------------------------------------------------

        classDef  ::= "controller" IDENT "(" IDENT ":" type ")" "{" methods "}"

        methods   ::= IDENT (IDENT+ | ())? "=" exprs

        exprs     ::= expr? (\n expr)*
        expr      ::= NUMBER 
                    | STRING 
                    | "self"  
                    | expr expr
                    | IDENT  "(" expr ")"
                    | IDENT  "{" args "}"
                    | "(" exprs ")"
                    | expr "," expr
                    | expr "." expr
                    | "[" expr | (IDENT <- expr) (if expr)? "]"

        // ----------------------------------------------------------------------

        viewDef   ::= "view" IDENT "(" IDENT ":" type  ")" "{" content "}"

        content   ::= (expr | tag)*
        tag       ::= "<" IDENT attr* ">" content "</" IDENT? ">" | "<" IDENT attr* "/>"
        attr      ::= IDENT=expr
    */
    
    function Language() {
        this.parser = parser();
        
        // Define constants
        var IDENT = /[a-zA-Z][a-zA-Z0-9_$]*/,
            accept = function (scope) { return true; },
            reject = function (scope) { return null; };

        // Define parse rules
        this.parser.addSkip(/[ \t\r\f]+/);
        
        // objectDef group
        this.parser.group('modelDef').
            addRule(["model", IDENT, "{", this.parser.entry("params"), "}"], accept);
        
        // Params group
        this.parser.group('params').
            addRule([IDENT, ":", this.parser.entry("type"), "\n"], accept).
            addRule([], accept);

        // Type and types groups
        this.parser.group('type').
            addRule(IDENT, accept).
            addRule(["(", this.parser.entry("types"), ")"], accept).
            addRule(["[", this.parser.entry("types"), "]"], accept).
            addRule([], reject);

        this.parser.group('types').
            addRule([this.parser.entry("type"), ",", this.parser.entry("types")], accept).
            addRule([this.parser.entry("type")], accept).
            addRule([], reject);
    }

    return new Language();
}());
  