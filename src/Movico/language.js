/*global exports, require, parseInt*/

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
        bind = require('../Analyser/bind.js').bind,
        ast  = require('./ast.js').ast;
    
    /*
       MovicoJS grammar definition   

        entity  ::= modelDef | classDef | viewDef

        modelDef  ::= "model" IDENT "{" param* "}"
        param     ::= IDENT ":" type

        type      ::= IDENT | "(" types ")" | "[" type "]"
        types     ::= type ("," type)*

        // ----------------------------------------------------------------------

        classDef  ::= "controller" IDENT "(" IDENT ":" type ")" "{" methods "}"

        methods   ::= IDENT (IDENT+ | ())? "=" expr

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
            NUMBER = /[+\-]?\d+/,
            STRING = /"[^"]*"/,
            SPACES = /\s+/,
            // ---
            reject = function (scope) { return null; },
            that = this,
            entry = function (name) { return that.parser.entry(name); };

        // Define parse rules
        this.parser.addSkip(SPACES);
        
        // objectDef group
        this.parser.group('modelDef').
            addRule(["model", bind(IDENT).to('name'), "{", bind(entry("params")).to('params'), "}"], function (scope) {
                return ast.model(scope.name, scope.params);
            });
        
        // Params group
        this.parser.group('params').
            addRule([bind(IDENT).to('name'), ":", bind(entry("type")).to('type'), bind(entry("params")).to('params')], function (scope) {
                return [ast.param(scope.name, scope.type)].concat(scope.params);
            }).
            addRule([], function (scope) {
                return [];
            });

        // Type and types groups
        this.parser.group('type').
            addRule(IDENT, function (scope) { return ast.type(); }).
            addRule(["(", entry("types"), ")"], function (scope) {
                return ast.type();
            }).
            addRule(["[", entry("types"), "]"], function (scope) {
                return ast.type();
            }).
            addRule([], reject);

        this.parser.group('types').
            addRule([entry("type"), ",", entry("types")], function (scope) {
                return ast.type();
            }).
            addRule([this.parser.entry("type")], function (scope) {
                return ast.type();
            }).
            addRule([], reject);
        
        // controllerDef group
        this.parser.group('controllerDef').
            addRule(["controller", bind(IDENT).to('name'),
                     "(", bind(IDENT).to('that'), ":", bind(entry("type")).to('type'), ")",
                     "{", bind(entry("methods")).to('methods'), "}"], function (scope) {
                return ast.controller(scope.name, ast.param(scope.that, scope.type), scope.methods);
            });
        
        this.parser.group('methods').
            addRule([bind(entry("method")).to('method'), bind(entry("methods")).to('methods')], function (scope) {
                return [scope.method].concat(scope.methods);
            }).
            addRule([], function (scope) {
                return [];
            });

        this.parser.group('method').
            addRule([bind(IDENT).to('name'), "=", bind(entry("expr")).to('body')], function (scope) {
                return ast.method(scope.name, null, scope.body);
            });
        
        this.parser.group('expr').
            addRule(bind(NUMBER).to('number'), function (scope) {
                return ast.number(parseInt(scope.number));
            }).
            addRule(bind(STRING).to('string'), function (scope) {
                return ast.string(scope.string);
            }).
            addRule(["self", "(", bind(entry("expr")).to('exrp'), ")"], function (scope) {
                return [];
            }).
            addRule("self", function (scope) {
                return [];
            });
    
    }
    
    return new Language();
}());
  