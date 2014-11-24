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
        optrep = require('../Analyser/optrep.js').optrep,
        rep = require('../Analyser/rep.js').rep,
        ast  = require('./ast.js').ast;
    
    var IDENT = /[a-zA-Z][a-zA-Z0-9_$]*/,
        NUMBER = /[+\-]?\d+/,
        STRING = /"([^"]|\")*"/,
        SIMPLESTRING = /'([^']|\')*'/,
        SPACES = /\s+/;
    
    function Language() {
        this.parser = parser();
        
        var that = this,
            entry = function (name) { return that.parser.entry(name); };

        // Define parse rules
        this.parser.addSkip(SPACES);
        
        // objectDef group
        this.parser.group('modelDef').
            addRule(["model", bind(IDENT).to('name'), "{", bind(optrep(entry("param"))).to('params'), "}"], function (scope) {
                return ast.model(scope.name, scope.params);
            });
        
        // Params group
        this.parser.group('param').
            addRule([bind(IDENT).to('name'), ":", bind(entry("type")).to('type')], function (scope) {
                return ast.param(scope.name, scope.type);
            });

        // Type and types groups
        this.parser.group('type').
            addRule(IDENT, function (scope) { return ast.type(); }).
            addRule(["(", entry("types"), ")"], function (scope) {
                return ast.type();
            }).
            addRule(["[", entry("types"), "]"], function (scope) {
                return ast.type();
            });

        this.parser.group('types').
            addRule([entry("type"), optrep([",", entry("types")])], function (scope) {
                return ast.type();
            });
        
        // controllerDef group
        this.parser.group('controllerDef').
            addRule(["controller", bind(IDENT).to('name'),
                     "(", bind(IDENT).to('that'), ":", bind(entry("type")).to('type'), ")",
                     "{", bind(optrep(entry("method"))).to('methods'), "}"], function (scope) {
                return ast.controller(scope.name, ast.param(scope.that, scope.type), scope.methods);
            });
        
        this.parser.group('method').
            addRule([bind(IDENT).to('name'), "=", bind(entry("expr")).to('body')], function (scope) {
                return ast.method(scope.name, null, scope.body);
            }).
            addRule([bind(IDENT).to('name'), "(", ")", "=", bind(entry("exprs")).to('body')], function (scope) {
                return ast.method(scope.name, [], scope.body);
            });
        
        this.parser.group('exprs').
            addRule([bind(IDENT).to('ident'), "{", bind(optrep(entry("expr"))).to('body'), "}"], function (scope) {
                return ast.instance(scope.ident, scope.body);
            }).
            addRule([bind(entry("expr")).to('expr'), ".", bind(entry("exprs")).to('exprs')], function (scope) {
                return ast.invoke(scope.expr, scope.exprs);
            }).
            addRule([bind(entry("expr")).to('expr'), ",", bind(entry("exprs")).to('exprs')], function (scope) {
                return ast.couple(scope.expr, scope.exprs);
            }).
            addRule(bind(rep(entry("expr"))).to('exprs'), function (scope) {
                if (scope.exprs.length == 1) {
                    return scope.exprs[0];
                } else {
                    return ast.application(scope.exprs);
                }
            });
        
        this.parser.group('expr').
            addRule(bind(NUMBER).to('number'), function (scope) {
                return ast.number(parseInt(scope.number));
            }).
            addRule(bind(STRING).to('string'), function (scope) {
                return ast.string(scope.string.substring(1,scope.string.length-1));
            }).
            addRule(bind(SIMPLESTRING).to('string'), function (scope) {
                return ast.string(scope.string.substring(1,scope.string.length-1));
            }).
            addRule(bind(IDENT).to('ident'), function (scope) {
                return ast.ident(scope.ident);
            }).
            addRule(["(", bind(entry("exprs")).to("exprs"), ")"], function (scope) {
                return scope.exprs;
            });
    
    }
    
    return new Language();
}());
  