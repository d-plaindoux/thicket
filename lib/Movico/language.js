/*global exports, require, parseFloat*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.language = function () {

    'use strict';
    
    var parser = require('../Parser/parser.js').parser,
        bind = require('../Parser/bind.js').bind,
        optrep = require('../Parser/optrep.js').optrep,
        rep = require('../Parser/rep.js').rep,
        choice = require('../Parser/choice.js').choice,
        commit = require('../Parser/commit.js').commit,        
        ast  = require('./ast.js').ast,
    
        KEYWORDS = ["if", "for", "model", "class", "view", "let", "in", "fun"],
        IDENT = /^[a-zA-Z_][a-zA-Z0-9_$]*/,
        TIDENT = /^'[a-zA-Z_][a-zA-Z0-9_$]*/,
        NUMBER = /^[+\-]?\d+/,
        DBQUOTEDSTRING = /^"[^"]*"/,
        QUOTEDSTRING = /^'[^']*'/,
        SPACES = /^\s+/,
        LINECOMMENT=/^\/\/[^\n]*\n?/;
    
    function Language() {
        var that = this;
        
        this.parser = parser();
        this.E = function (name) { return that.parser.entry(name); };     
            
        this.skip();
        this.ident();
        
        this.entities();
        this.model();
        this.controller();
        this.view();
                
        this.param();
        this.type();
        this.expression();
    }
    
    Language.prototype.skip = function () {
        // Define parse rules
        this.parser.addSkip(SPACES);
        this.parser.addSkip(LINECOMMENT);
    };
    
    Language.prototype.ident = function () {
        this.parser.group('ident').
            addRule(bind(IDENT).to('ident'), function (scope) {
                if (KEYWORDS.indexOf(scope.ident) > -1) {
                    return null;
                } else {
                    return scope.ident;
                }
            });
    };
        
    Language.prototype.entities = function() {
        // entities -- Main entry
        this.parser.group("entities").
            addRule(bind(optrep(this.E("entityDef"))).to('entities'), function (scope) {
                return scope.entities;
            });
        
        // entityDef group
        this.parser.group("entityDef").
            addRule(bind(this.E("modelDef")).to('model'), function (scope) {
                return scope.model;
            }).
            addRule(bind(this.E("controllerDef")).to('controller'), function (scope) {
                return scope.controller;
            }).
            addRule(bind(this.E("viewDef")).to('view'), function (scope) {
                return scope.view;
            });
    };
      
    Language.prototype.model = function () {
        // objectDef group
        this.parser.group("modelDef").
            addRule(["model", bind(this.E('ident')).to("name"), bind(optrep(TIDENT)).to("generics"), 
                     "{", bind(optrep(this.E("param"))).to("params"), "}"], function (scope) {
                return ast.model(scope.name, scope.generics, scope.params);
            });
    };  
        
    Language.prototype.controller = function () {
        // controllerDef group
        this.parser.group('controllerDef').
            addRule(["class", bind(this.E('ident')).to('name'), bind(optrep(TIDENT)).to("generics"),
                     bind(this.E('ident')).to('that'), ":", bind(this.E("type")).to('type'),
                     "{", bind(optrep(this.E("method"))).to('methods'), "}"], function (scope) {
                return ast.controller(scope.name, scope.generics, ast.param(scope.that, scope.type), scope.methods);
            });
        
        this.parser.group('method').
            addRule([bind(this.E('ident')).to('name'), "=", commit(bind(this.E("expr")).to('body'))], function (scope) {
                return ast.method(scope.name, scope.body);
            }).
            addRule([bind(this.E('ident')).to('name'), "(", commit([")", "=", bind(this.E("expr")).to('body')])], function (scope) {
                return ast.method(scope.name, ast.expr.abstraction(ast.param("_",ast.type.native("unit")), scope.body));
            }).
            addRule([bind(this.E('ident')).to('name'), bind(optrep(TIDENT)).to("generics"), bind(rep(this.E("param"))).to('params'), "=", bind(this.E("expr")).to('body')], function (scope) {
                 var result = scope.body;
                scope.params.reverse().forEach(function (param) {
                    result = ast.expr.abstraction(param, result);
                });
                scope.generics.reverse().forEach(function (generic) {
                    result = ast.expr.forall(generic, result);
                });                        
                return ast.method(scope.name, result);
            });
    };
    
    Language.prototype.view = function () {
        // viewDef group
        this.parser.group('viewDef').
            addRule(["view", bind(this.E('ident')).to('name'), bind(this.E('param')).to('param'),
                     "{", bind(optrep(this.E("expr"))).to('body'), "}"], function (scope) {
                return ast.view(scope.name, scope.param, scope.body);
            });                
    };

    Language.prototype.param = function () {    
        // Params group
        this.parser.group('param').
            addRule([bind(this.E('ident')).to('name'), ":", bind(this.E("types")).to('type')], function (scope) {
                return ast.param(scope.name, scope.type);
            });
    };
    
    Language.prototype.type = function () {
        // Type and types groups
        this.parser.group('type').
            addRule(bind(this.E('ident')).to('name'), function (scope) {
                switch (scope.name) {
                    case 'int':
                        return ast.type.native(scope.name); 
                    case 'string':
                        return ast.type.native(scope.name); 
                    default:
                        return ast.type.variable(scope.name); 
                }
            }).
            addRule(bind(TIDENT).to('name'), function (scope) {
                return ast.type.variable(scope.name); 
            }).
            addRule(["(", commit([bind(this.E("ftypes")).to('type'), ")"])], function (scope) {
                return scope.type;
            }).
            addRule(["[", bind(this.E("type")).to('type'), "]"], function (scope) {
                return ast.type.array(scope.type);
            });

        this.parser.group('ftypes').
            addRule([bind(this.E("types")).to("type"), bind(optrep(this.E('ftypes'))).to('params')], function (scope) {
                return scope.type;
            });

        this.parser.group('types').
            addRule([bind(this.E("type")).to('left'), ",", commit(bind(this.E("types")).to('right'))], function (scope) {
                return ast.type.pair(scope.left, scope.right);
            }).
            addRule([bind(this.E("type")).to('left'), "->", commit(bind(this.E("types")).to('right'))], function (scope) {
                return ast.type.abstraction(scope.left, scope.right);
            }).
            addRule([bind(this.E("type")).to('left')], function (scope) {
                return scope.left;
            });
    };
    
    Language.prototype.expression = function () {
        this.parser.group('exprs').
            addRule(bind(rep(this.E("expr"))).to('exprs'), function (scope) {
                var result = null;
                scope.exprs.forEach(function (expr) {
                    if (!result) {
                        result = expr;
                    } else {
                        result = ast.expr.application(result, expr);
                    }
                });
                return result;
            });
        
        // Expression group
        this.parser.group('expr').
            addRule([bind(this.E("iexpr")).to('expr'), bind(optrep([",",this.E('iexpr')])).to('exprs')], function (scope) {
                var result = null;
                [['',scope.expr]].concat(scope.exprs).reverse().forEach(function (l) {
                    if (result === null) {
                        result = l[1];
                    } else {
                        result = ast.expr.pair(l[1], result);
                    }
                });
                return result;    
            });
                
        // Expression group
        this.parser.group('iexpr').
            addRule([bind(this.E("sexpr")).to('expr'), bind(optrep([".",IDENT])).to('exprs')], function (scope) {
                var result = scope.expr;
                scope.exprs.forEach(function (l) {
                    result = ast.expr.invoke(result, l[1]);
                });
                return result;    
            });

        
        // Simple expression group
        this.parser.group('sexpr').
            addRule([bind(this.E('ident')).to('ident'), "{", commit([bind(optrep(this.E("expr"))).to('body'), "}"])], function (scope) {
                return ast.expr.instance(scope.ident, scope.body);
            }).
            addRule(bind(this.E('ident')).to('ident'), function (scope) {
                return ast.expr.ident(scope.ident);
            }).
            addRule(["[", commit([bind(this.E("exprs")).to('expr'),
                                  bind(rep(["for", this.E('ident'), "in", this.E("exprs")])).to('iterations'),
                                  bind(optrep(['if', this.E("exprs")])).to('conditions'), "]"])], function (scope) {
                return ast.expr.comprehension(scope.expr,
                                              scope.iterations.map(function (l) { return [l[1], l[3]]; }),
                                              scope.conditions.map(function (l) { return l[1]; })
                                             );
            }).
            addRule(["<", commit([bind(IDENT).to('sname'), 
                                  bind(optrep([IDENT, "=", this.E('expr')])).to('attributes'), 
                                  bind(this.E("tag-body")).to("result")])], function (scope) {
                if (scope.result.hasOwnProperty('ename') && scope.sname !== scope.result.ename) {
                    return null;
                }
            
                return ast.expr.tag(scope.sname, scope.attributes.map(function (l) { return [l[0], l[2]]; }), scope.result.body || []);
            }). 
            addRule(bind(NUMBER).to('number'), function (scope) {
                return ast.expr.number(parseFloat(scope.number, 10));
            }).
            addRule(bind(choice([DBQUOTEDSTRING, QUOTEDSTRING])).to('string'), function (scope) {
                return ast.expr.string(scope.string.slice(1, scope.string.length - 1));
            }).
            addRule(["(", bind(this.E("exprs")).to("exprs"), ")"], function (scope) {
                return scope.exprs;
            }).
            addRule(["(", ")"], function () {
                return ast.expr.unit();
            }).
            addRule(["let", bind(IDENT).to('ident'), commit(bind(this.E("let-body")).to("body"))], function (scope) {
                return scope.body(scope.ident);
            }).
            addRule(["fun", "(", commit([")", "=>", bind(this.E('expr')).to('body')])], function (scope) {
                return ast.expr.abstraction(ast.param("_",ast.type.native("unit")), scope.body);
            }).
            addRule(["fun", bind(this.E('fun-body')).to('body')], function (scope) {
                return scope.body;
            });            

        this.parser.group("fun-body").
            addRule(["(", commit([")", "=>", bind(this.E('expr')).to('body')])], function (scope) {
                return ast.expr.abstraction(ast.param("_",ast.type.native("unit")), scope.body);
            }).
            addRule([bind(optrep(TIDENT)).to("generics"), bind(rep(this.E("param"))).to('params'), "=>", bind(this.E('expr')).to('body')], function (scope) {
                var result = scope.body;
                scope.params.reverse().forEach(function (param) {
                    result = ast.expr.abstraction(param, result);
                });
                scope.generics.reverse().forEach(function (generic) {
                    result = ast.expr.forall(generic, result);
                });                        
                return result;
            });                    
        
        this.parser.group('let-body').
            addRule(['=', commit([bind(this.E('expr')).to('expr'), "in", bind(this.E('expr')).to('body')])], function (scope) {
                return function (ident) { return ast.expr.let(ident, scope.expr, scope.body); };
            }).
            addRule(['(', commit([')', '=', bind(this.E('expr')).to('expr'), 
                     "in", bind(this.E('expr')).to('body')])], function (scope) {
                return function (ident) { 
                    return ast.expr.let(ident, 
                                        ast.expr.abstraction(ast.param("_",ast.type.native("unit")), scope.expr), 
                                        scope.body); 
                };
            }).
            addRule([bind(optrep(TIDENT)).to("generics"), bind(rep(this.E("param"))).to('params'), '=', bind(this.E('expr')).to('expr'), "in", bind(this.E('expr')).to('body')], function (scope) {
                var result = scope.expr;
                scope.params.reverse().forEach(function (param) {
                    result = ast.expr.abstraction(param, result);
                });
                scope.generics.reverse().forEach(function (generic) {
                    result = ast.expr.forall(generic, result);
                });                        
                return function (ident) { return ast.expr.let(ident, result, scope.body); };
            });

        this.parser.group('tag-body').
            addRule(["/",">"], function (scope) {
                return scope;
            }).
            addRule([">", bind(optrep(this.E('exprs'))).to('body'), "</", bind(IDENT).to('ename'), ">"], function (scope) {
                return scope;
            });
    };
    
    return new Language();
};
  