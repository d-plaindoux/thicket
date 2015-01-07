/*global exports, require, parseFloat*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.language = function () {

    'use strict';
    
    var parser = require('../Parser/parser.js').parser,
        bind = require('../Parser/bind.js').bind,
        eos = require('../Parser/eos.js').eos,
        opt = require('../Parser/opt.js').opt,
        optrep = require('../Parser/optrep.js').optrep,
        rep = require('../Parser/rep.js').rep,
        choice = require('../Parser/choice.js').choice,
        commit = require('../Parser/commit.js').commit,                
        ast  = require('./ast.js').ast,
    
        OPERATOR = /^[><=+*/-]+/,
        SEPARATOR = ["<", ">", "/>", "</", "=>", "->", "="],
        KEYWORDS = ["if", "for", "model", "class", "view", "let", "in", "fun", "def"],
        IDENT = /^[a-zA-Z_][a-zA-Z0-9_$]*/,
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
        this.generics();
        
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
        this.parser.group('operator').
            addRule(bind(OPERATOR).to('ident'), function (scope) {
                if (SEPARATOR.indexOf(scope.ident) > -1) {
                    return null;
                } else {
                    return scope.ident;
                }
            });
    };

    Language.prototype.generics = function () {
        this.parser.group('generics').
            addRule(bind(opt(["[",rep(this.E("ident")),"]"])).to("generics"), function (scope) {
                if (scope.generics.length === 0) {
                    return [];
                } else {
                    return scope.generics[0][1];
                }
            });
    };

    Language.prototype.entities = function() {
        // entities -- Main entry
        this.parser.group("entities").
            addRule([bind(optrep(this.E("entityDef"))).to('entities'),eos], function (scope) {
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
            addRule(["model", bind(this.E('ident')).to("name"), bind(this.E("generics")).to("generics"), 
                     opt([":", this.E("types")]),
                     "{", bind(optrep(this.E("tparam"))).to("params"), "}"], function (scope) {
                return ast.model(scope.name, scope.generics, scope.params);            
            });
    };  
        
    Language.prototype.controller = function () {
        // controllerDef group
        this.parser.group('controllerDef').
            addRule(["class", bind(this.E('ident')).to('name'), bind(this.E("generics")).to("generics"),
                     bind(this.E('ident')).to('that'), ":", bind(this.E("types")).to('type'),
                     "{", bind(optrep(this.E("tparam"))).to("params"), "}",
                     "{", bind(optrep(this.E("method"))).to('methods'), "}"], function (scope) {
                return ast.controller(scope.name, scope.generics, ast.param(scope.that, scope.type), scope.params, scope.methods);
            });
        
        this.parser.group('method').
            addRule(["def", bind(opt([this.E("types"), "."])).to("caller"), bind(this.E('methodName')).to('name'), bind(optrep(this.E("ident"))).to('idents'), "=", 
                     bind(this.E("exprs")).to('body')], function (scope) {
                var result = scope.body;
            
                scope.idents.reverse().forEach(function (ident) {
                    result = ast.expr.abstraction(ident, result);
                });
            
                if (scope.caller.length > 0) {
                    return ast.method(scope.name, result, scope.caller[0][0]);
                }
            
                return ast.method(scope.name, result);
            });
        
        this.parser.group("methodName").
            addRule(bind(this.E("ident")).to("ident"), function (scope) {
                return scope.ident;
            }).
            addRule(["(", bind(this.E("operator")).to("ident"), ")"], function (scope) {
                return scope.ident;
            });        
    };
    
    Language.prototype.view = function () {
        // viewDef group
        this.parser.group('viewDef').
            addRule(["view", bind(this.E('ident')).to('name'), bind(this.E("generics")).to("generics"), bind(this.E('param')).to('param'),
                     "{", bind(optrep(this.E("expr"))).to('body'), "}"], function (scope) {
                return ast.view(scope.name, scope.generics, scope.param, scope.body);
            });                
    };

    Language.prototype.param = function () {    
        // Params group
        this.parser.group('param').
            addRule([bind(this.E('ident')).to('name'), ":", bind(this.E("types")).to('type')], function (scope) {
                return ast.param(scope.name, scope.type);
            });
        
        this.parser.group('tparam').
            addRule([bind(this.E('methodName')).to('name'), ":", bind(this.E("generics")).to("generics"), bind(this.E("types")).to('type')], function (scope) {
                var result = scope.type;
                if (scope.generics.length > 0) {
                    result = ast.type.forall(scope.generics, result);
                }
                return ast.param(scope.name, result);
            });
    };
    
    Language.prototype.type = function () {
        // Type and types groups
        this.parser.group('type').
            addRule(["(", commit([bind(this.E("types")).to('type'), ")"])], function (scope) {
                return scope.type;
            }).
            addRule([bind(this.E("ident")).to("name"), bind(opt(["[", rep(this.E('type')), "]"])).to('params')], function (scope) {
                var result;
                switch (scope.name) {
                    case 'unit':
                    case 'number':
                    case 'string':
                    case 'xml':
                        result = ast.type.native(scope.name); 
                        break;
                    default:
                        result = ast.type.variable(scope.name); 
                        break;
                }
                if (scope.params.length > 0) {
                    scope.params[0][1].reverse().forEach(function (type) {
                        result = ast.type.specialize(result, type);
                    });
                }
                return result;
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
            addRule([bind(this.E("expr")).to("expr"), bind(this.E("trailingExpr")).to("trailingExpr")], function (scope) {
                return scope.trailingExpr(scope.expr);
            });
        
        this.parser.group("trailingExpr").
            addRule([bind(this.E("operator")).to("operator"), commit(bind(this.E("trailingExpr")).to("trailingExpr"))], function (scope) {                
                return function (expr) {
                    return scope.trailingExpr(ast.expr.invoke(expr, scope.operator)); 
                };
            }).
            addRule([bind(this.E("expr")).to("expr"), commit(bind(this.E("trailingExpr")).to("trailingExpr"))], function (scope) {
                return function (expr) {
                    return scope.trailingExpr(ast.expr.application(expr, scope.expr));
                };
            }).
            addRule([], function () {
                return function (expr) { 
                    return expr;
                };
            });
        
        // Expression group
        this.parser.group('expr').
            addRule([bind(this.E("iexpr")).to('expr'), bind(optrep([",",commit(this.E('iexpr'))])).to('exprs')], function (scope) {
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
            addRule([bind(this.E("sexpr")).to('expr'), bind(optrep([".",this.E("methodName")])).to('exprs')], function (scope) {
                var result = scope.expr;
                scope.exprs.forEach(function (l) {
                    result = ast.expr.invoke(result, l[1]);
                });
                return result;    
            });

        
        // Simple expression group
        this.parser.group('sexpr').
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
            addRule(["fun", bind(this.E('fun-body')).to('body')], function (scope) {
                return scope.body;
            });            
         
        this.parser.group('let-body').
            addRule([bind(optrep(this.E("ident"))).to('params'), '=', 
                     bind(this.E('exprs')).to('expr'), "in", bind(this.E('exprs')).to('body')], function (scope) {
                var result = scope.expr;
                scope.params.reverse().forEach(function (param) {
                    result = ast.expr.abstraction(param, result);
                });
                return function (ident) { return ast.expr.let(ident, result, scope.body); };
            });

        this.parser.group("fun-body").
            addRule([bind(rep(this.E("ident"))).to('params'), "=>", 
                     bind(this.E('exprs')).to('body')], function (scope) {
                var result = scope.body;
                scope.params.reverse().forEach(function (param) {
                    result = ast.expr.abstraction(param, result);
                });
                return result;
            });           
        
        this.parser.group('tag-body').
            addRule(["/>"], function (scope) {
                return scope;
            }).
            addRule([">", bind(optrep(this.E('exprs'))).to('body'), "</", bind(IDENT).to('ename'), ">"], function (scope) {
                return scope;
            });
    };
    
    return new Language();
};
  