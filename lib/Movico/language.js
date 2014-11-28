/*global exports, require, parseFloat*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.language = (function () {
    
    'use strict';
    
    var parser = require('../Parser/parser.js').parser,
        bind = require('../Parser/bind.js').bind,
        optrep = require('../Parser/optrep.js').optrep,
        rep = require('../Parser/rep.js').rep,
        opt = require('../Parser/opt.js').opt,
        commit = require('../Parser/commit.js').commit,        
        ast  = require('./ast.js').ast,
    
        KEYWORDS = ["if", "for", "model", "controller", "view", "let", "in"],
        IDENT = /[a-zA-Z][a-zA-Z0-9_$]*/,
        NUMBER = /[+\-]?\d+/,
        DBQUOTEDSTRING = /"[^"]*"/,
        QUOTEDSTRING = /'[^']*'/,
        SPACES = /\s+/,
        LINECOMMENT = /\/\/[^\n]*/;
    
    function Language() {
        this.parser = parser();
        
        var that = this,
            entry = function (name) { return that.parser.entry(name); };

        // Define parse rules
        this.parser.addSkip(SPACES);
        this.parser.addSkip(LINECOMMENT);
        
        // entities -- Main entry
        this.parser.group("entities").
            addRule(bind(optrep(entry("entityDef"))).to('entities'), function (scope) {
                return scope.entities;
            });
        
        // entityDef group
        this.parser.group("entityDef").
            addRule(bind(entry("modelDef")).to('model'), function (scope) {
                return scope.model;
            }).
            addRule(bind(entry("controllerDef")).to('controller'), function (scope) {
                return scope.controller;
            }).
            addRule(bind(entry("viewDef")).to('view'), function (scope) {
                return scope.view;
            });
        
        // objectDef group
        this.parser.group("modelDef").
            addRule(["model", bind(entry('ident')).to("name"), "{", bind(optrep(entry("param"))).to("params"), "}"], function (scope) {
                return ast.model(scope.name, scope.params);
            });
        
        // Params group
        this.parser.group('param').
            addRule([bind(entry('ident')).to('name'), ":", bind(entry("type")).to('type')], function (scope) {
                return ast.param(scope.name, scope.type);
            });

        // Type and types groups
        this.parser.group('type').
            addRule(bind(entry('ident')).to('name'), function (scope) {
                return ast.type.ident(scope.name); 
            }).
            addRule(["(", commit([bind(entry("types")).to('type'), ")"])], function (scope) {
                return scope.type;
            }).
            addRule(["[", bind(entry("types")).to('type'), "]"], function (scope) {
                return ast.type.array(scope.type);
            });

        this.parser.group('types').
            addRule([bind(entry("type")).to('left'), opt([",", bind(entry("types")).to('right')])], function (scope) {
                if (scope.hasOwnProperty('right')) {
                    return ast.type.pair(scope.left, scope.right);
                } else {
                    return scope.left;
                }
            });
        
        // controllerDef group
        this.parser.group('controllerDef').
            addRule(["controller", bind(entry('ident')).to('name'),
                     bind(entry('ident')).to('that'), ":", bind(entry("type")).to('type'),
                     "{", bind(optrep(entry("method"))).to('methods'), "}"], function (scope) {
                return ast.controller(scope.name, ast.param(scope.that, scope.type), scope.methods);
            });
        
        this.parser.group('method').
            addRule([bind(entry('ident')).to('name'), "=", commit(bind(entry("expr")).to('body'))], function (scope) {
                return ast.method(scope.name, null, scope.body);
            }).
            addRule([bind(entry('ident')).to('name'), "(", ")", commit(["=", bind(entry("expr")).to('body')])], function (scope) {
                return ast.method(scope.name, [], scope.body);
            }).
            addRule([bind(entry('ident')).to('name'), bind(rep(IDENT)).to('params'), "=", bind(entry("expr")).to('body')], function (scope) {
                return ast.method(scope.name, scope.params, scope.body);
            });
        
        this.parser.group('exprs').
            addRule(bind(rep(entry("expr"))).to('exprs'), function (scope) {
                if (scope.exprs.length === 1) {
                    return scope.exprs[0];
                } else {
                    return ast.expr.application(scope.exprs);
                }
            });
        
        this.parser.group('expr').
            addRule([bind(entry("sexpr")).to('expr'), opt([bind(/[.,]/).to('operator'), bind(entry("expr")).to('exprs')])], function (scope) {
                if (scope.hasOwnProperty('exprs')) {
                    switch (scope.operator) {
                    case '.':
                        return ast.expr.invoke(scope.expr, scope.exprs);
                    case ',':
                        return ast.expr.pair(scope.expr, scope.exprs);
                    default:
                        return null;
                    }
                } else {
                    return scope.expr;
                }
            });

        this.parser.group('sexpr').
            addRule([bind(entry('ident')).to('ident'), "{", commit([bind(optrep(entry("expr"))).to('body'), "}"])], function (scope) {
                return ast.expr.instance(scope.ident, scope.body);
            }).
            addRule(["[", commit([bind(entry("exprs")).to('expr'),
                                  bind(rep(["for", entry('ident'), "<-", entry("exprs")])).to('iterations'),
                                  bind(opt(['if', entry("exprs")])).to('condition'), "]"])], function (scope) {
                return ast.expr.comprehension(scope.expr,
                                         scope.iterations.map(function (l) { return [ast.expr.ident(l[1]), l[3]]; }),
                                         scope.condition.map(function (l) { return l[1]; })
                                        );
            }).
            addRule(["<", commit([bind(IDENT).to('sname'), bind(optrep([IDENT, "=", entry('expr')])).to('attributes'), bind(entry("tag-body")).to("result")])], function (scope) {
                if (scope.result.hasOwnProperty('ename') && scope.sname !== scope.result.ename) {
                    return null;
                }
            
                return ast.expr.tag(scope.sname, scope.attributes.map(function (l) { return [l[0], l[2]]; }), scope.result.body);
            }). 
            addRule(bind(NUMBER).to('number'), function (scope) {
                return ast.expr.number(parseFloat(scope.number, 10));
            }).
            addRule(bind(DBQUOTEDSTRING).to('string'), function (scope) {
                return ast.expr.string(scope.string.substring(1, scope.string.length - 1));
            }).
            addRule(bind(QUOTEDSTRING).to('string'), function (scope) {
                return ast.expr.string(scope.string.substring(1, scope.string.length - 1));
            }).
            addRule(bind(entry('ident')).to('ident'), function (scope) {
                return ast.expr.ident(scope.ident);
            }).
            addRule(["(", ")"], function () {
                return ast.expr.unit();
            }).
            addRule(["(", bind(entry("exprs")).to("exprs"), ")"], function (scope) {
                return scope.exprs;
            }).
            addRule(["let", bind(IDENT).to('ident'), '=', bind(entry('expr')).to('expr'), "in", bind(entry('expr')).to('body')], function (scope) {
                return ast.expr.let(scope.ident, scope.expr, scope.body);
            });    

        this.parser.group('tag-body').
            addRule("/>", function (scope) {
                return scope;
            }).
            addRule([">", bind(optrep(entry('exprs'))).to('body'), "</", bind(IDENT).to('ename'), ">"], function (scope) {
                return scope;
            });                          

        this.parser.group('ident').
            addRule(bind(IDENT).to('ident'), function (scope) {
                if (KEYWORDS.indexOf(scope.ident) > -1) {
                    return null;
                } else {
                    return scope.ident;
                }
            });
    
        // viewDef group
        this.parser.group('viewDef').
            addRule(["view", bind(entry('ident')).to('name'), 
                     bind(entry('ident')).to('that'), ":", bind(entry("type")).to('type'),
                     "{", bind(optrep(entry("expr"))).to('body'), "}"], function (scope) {
                return ast.view(scope.name, ast.param(scope.that, scope.type), scope.body);
            });
        
    }
    
    return new Language();
}());
  