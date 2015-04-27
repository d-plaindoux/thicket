/*global parseFloat*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function () {

    'use strict';

    var parser = require('../../Parser/parser.js'),
        bind = require('../../Parser/bind.js'),
        eos = require('../../Parser/eos.js'),
        opt = require('../../Parser/opt.js'),
        optrep = require('../../Parser/optrep.js'),
        rep = require('../../Parser/rep.js'),
        choice = require('../../Parser/choice.js'),
        commit = require('../../Parser/commit.js'),
        ast  = require('./ast.js'),

        OPERATOR = /^([#?;:@&!%><=+*/|-]|\[|\])([#?;:@&!%><=+*/|_-]|\[|\])*/,
        SEPARATOR = ["[", "]", "(", ")", "{", "}", ",", "$", "<", ">", "/>", "</", "->", "=", "//", ":", ";;"],
        KEYWORDS = ["module","from", "import", "typedef", "type", "model", "class", "view", "def", "let", "in", "if", "for"],
        IDENT = /^[a-zA-Z_][a-zA-Z0-9_$]*/,
        NUMBER = /^[+-]?\d+/,
        DBQUOTEDSTRING = /^"[^"]*"/,
        QUOTEDSTRING = /^'[^']*'/,
        SPACES = /^\s+/,
        LINECOMMENT=/^\/\/[^\n]*\n?/,
        BLOCKCOMMENT=/^\/\*(.|\n)*?\*\//;

    function Language() {
        this.parser = parser();
            
        this.skip();
        this.ident();
        this.generics();

        this.module();
        this.source();
        this.moduleName();
        this.declarations();
        this.entities();
        this.definition();
        this.types();
        this.model();
        this.controller();
        this.view();

        this.param();
        this.type();
        this.expression();
    }
    
    Language.prototype.locate = function () {
        this.parser.addLocationFn(function(data,location) {
            if (data.$type) {
                return ast.locate(data,location);
            } else {
                return data;
            }
        });
        
        return this;
    };

    Language.prototype.E = function (name) {
        if (this.parser.entry(name)) {
            return this.parser.entry(name);
        }

        throw new Error("Language entry named " + name + " not found");
    };

    //
    // Language rules definition
    //

    Language.prototype.skip = function () {
        // Define parse rules
        this.parser.addSkip(SPACES);
        this.parser.addSkip(LINECOMMENT);
        this.parser.addSkip(BLOCKCOMMENT);
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
    
    Language.prototype.module = function() {
        // Source file -- Main entry
        this.parser.group("module").
            addRule(["module", bind(this.E("moduleNameDef")).to("namespace"), 
                     bind(this.E("source")).to("source")], function (scope) {
                return ast.module(scope.namespace,scope.source[0], scope.source[1]);
            });
    };
    
    Language.prototype.source = function() {
        // Source toplevel -- Main entry
        this.parser.group("source").
            addRule([bind(this.E("declarations")).to("declarations"), 
                     bind(this.E("entities")).to("entities")], function (scope) {
                return [scope.declarations, scope.entities];
            });
    };
    
    Language.prototype.declarations = function() {
        // declarations
        this.parser.group("declarations").
            addRule(bind(optrep(this.E("declarationDef"))).to('declarations'), function (scope) {
                return scope.declarations;
            });
        
        this.parser.group("declarationDef").
            addRule(["import", bind(this.E("moduleNameDef")).to("name")], function (scope) {
                return ast.imports(scope.name, []);
            }).
            addRule(["from", bind(this.E("moduleNameDef")).to("name"), 
                     "import", bind(this.E("importedItems")).to("names")], function (scope) {
                return ast.imports(scope.name, scope.names);
            });

        this.parser.group("importedItems").
            addRule("*", function () {
                return [];
            }).
            addRule(bind(rep(this.E("ident"))).to("idents"), function (scope) {
                return scope.idents;
            });
    };
    
    Language.prototype.moduleName = function () {
        this.parser.group("moduleNameDef").
            addRule([bind(this.E("ident")).to("ident"), bind(optrep([".",this.E("ident")])).to('idents')], function (scope) {        
                return [scope.ident].concat(scope.idents.map(function (ident) {
                    return ident[1];
                }));
            });        
    };

    Language.prototype.entities = function() {
        // entities
        this.parser.group("entities").
            addRule([bind(optrep(this.E("entityDef"))).to('entities'), eos], function (scope) {
                var entities = [];
                scope.entities.forEach(function (entity) {
                    entities = entities.concat(entity);
                });
                return entities;
            });

        // entityDef group
        this.parser.group("entityDef").        
            addRule(bind(this.E("typeDef")).to('type'), function (scope) {
                return [ scope.type ];
            }).
            addRule(bind(this.E("sortDef")).to('models'), function (scope) {
                return scope.models;
            }).
            addRule(bind(this.E("modelDef")).to('model'), function (scope) {
                return [ scope.model ];
            }).
            addRule(bind(this.E("controllerDef")).to('controller'), function (scope) {
                return [ scope.controller ];
            }).
            addRule(bind(this.E("viewDef")).to('view'), function (scope) {
                return [ scope.view ];
            }).
            addRule(bind(this.E("expressionDef")).to('expression'), function (scope) {
                return [ scope.expression ];
            });
    };

    Language.prototype.types = function () {
        // typeDef group
        this.parser.group("typeDef").
            addRule(["typedef", bind(this.E('ident')).to("name"), bind(this.E("generics")).to("generics1"),
                     "=", bind(this.E("generics")).to("generics2"), bind(this.E("types")).to('type')], function (scope) {
                var variables = scope.generics1.map(function (name) { return ast.type.variable(name); });
                return ast.type.forall(scope.generics1, ast.typedef(scope.name, variables, ast.type.forall(scope.generics2, scope.type)));
            });

        this.parser.group("sortDef").
            addRule(["type", bind(this.E('ident')).to("name"), bind(this.E("generics")).to("generics"),
                     "{", bind(rep(this.E("simpleModelDef"))).to("models"), "}"], function (scope) {
                var variables = scope.generics.map(function (name) { return ast.type.variable(name); }),
                    parent = ast.model(scope.name, variables, [], undefined, true);

                return scope.models.map(function (model) {
                    model.variables = variables;
                    model.parent = parent;
                    return ast.type.forall(scope.generics, model);
                }).concat(ast.type.forall(scope.generics, parent));
            });

        this.parser.group("simpleModelDef").
            addRule(["model", bind(this.E('ident')).to("name"),
                     "{", commit([bind(optrep(this.E("tparam"))).to("params"), "}"])], function (scope) {
                return ast.model(scope.name, [], scope.params);
            }).
            addRule(["model", bind(this.E('ident')).to("name")], function (scope) {
                return ast.model(scope.name, [], []);
            });
    };

    Language.prototype.definition = function() {
        // expressionDef group
        this.parser.group("expressionDef").
            addRule(["def", bind(this.E('methodName')).to('name'), ":", 
                     commit([bind(this.E("generics")).to("generics"), bind(this.E("types")).to('type'), 
                             "=", 
                             bind(this.E("exprs")).to('expr')])], function (scope) {                
                return ast.type.forall(scope.generics, ast.expression(scope.name, scope.type, scope.expr));
            }).
            addRule(["def", bind(this.E('methodName')).to('name'), "=", 
                     bind(this.E("exprs")).to('expr')], function (scope) {                
                return ast.expression(scope.name, null, scope.expr);
            });
    };
    
    Language.prototype.model = function () {
        // modelDef group
        this.parser.group("modelDef").
            addRule(["model", bind(this.E('ident')).to("name"), bind(this.E("generics")).to("generics"),
                     "{", commit([bind(optrep(this.E("tparam"))).to("params"), "}"])], function (scope) {
                var variables = scope.generics.map(function (name) { return ast.type.variable(name); });
                return ast.type.forall(scope.generics, ast.model(scope.name, variables, scope.params));
            }).
            addRule(["model", bind(this.E('ident')).to("name"), bind(this.E("generics")).to("generics")], function (scope) {
                var variables = scope.generics.map(function (name) { return ast.type.variable(name); });
                return ast.type.forall(scope.generics, ast.model(scope.name, variables, []));
            });
    };

    Language.prototype.controller = function () {
        // controllerDef group
        this.parser.group('controllerDef').
            addRule(["class", bind(this.E('ident')).to('name'), bind(this.E("generics")).to("generics"),
                     bind(this.E('ident')).to('that'), ":", bind(this.E("types")).to('type'),
                     "{", bind(optrep(this.E("tparam"))).to("params"), "}",
                     "{", bind(optrep(this.E("method"))).to('methods'), "}"], function (scope) {
                var variables = scope.generics.map(function (name) { return ast.type.variable(name); });
                return ast.type.forall(scope.generics, ast.controller(scope.name, variables, ast.param(scope.that, scope.type), scope.params, scope.methods));
            });

        this.parser.group('method').
            addRule(["def", bind(opt([this.E("ident"), "."])).to("caller"), bind(this.E('methodName')).to('name'), 
                     bind(optrep([this.E("ident"), opt([":", this.E("generics"), this.E("types")])])).to('idents'), "=",
                     bind(this.E("exprs")).to('body')], function (scope) {
                var result = scope.body;

                scope.idents.reverse().forEach(function (ident) {
                    var variableType;
                    
                    if (ident[1].length > 0) {
                        variableType = ast.type.forall(ident[1][0][1], ident[1][0][2]);
                    }
                    
                    result = ast.expr.abstraction(ident[0], result, variableType);
                });

                if (scope.caller.length > 0) {
                    return ast.method(scope.name, result, ast.type.variable(scope.caller[0][0]));
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
                var variables = scope.generics.map(function (name) { return ast.type.variable(name); });
                return ast.type.forall(scope.generics, ast.view(scope.name, variables, scope.param, scope.body));
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
                return ast.param(scope.name, ast.type.forall(scope.generics, scope.type));
            });
    };

    Language.prototype.type = function () {
        // Type and types groups
        this.parser.group('type').
            addRule(["(", commit([bind(this.E("types")).to('type'), ")"])], function (scope) {
                return scope.type;
            }).
            addRule([bind(this.E("ident")).to("name"), bind(opt(["[", rep(this.E('type')), "]"])).to('params')], function (scope) {
                var result = ast.type.variable(scope.name);

                if (scope.params.length > 0) {
                    result = ast.type.specialize(result, scope.params[0][1]);
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
            addRule([bind(this.E("type")).to('type')], function (scope) {
                return scope.type;
            });
    };

    Language.prototype.expression = function () {
        this.parser.group('sentence').
            addRule([bind(this.E("exprs")).to("expr"), eos], function (scope) {
                return scope.expr;
            });
        
        this.parser.group('exprs').
            addRule([bind(this.E("expr")).to("expr"), bind(this.E("trailingExpr")).to("trailingExpr")], function (scope) {
                return scope.trailingExpr(scope.expr);
            });

        this.parser.group("trailingExpr").
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
            addRule([bind(this.E('fun-body')).to('body')], function (scope) {
                return scope.body;
            }).           
            addRule(bind(NUMBER).to('number'), function (scope) {
                return ast.expr.number(parseFloat(scope.number, 10));
            }).
            addRule(bind(choice([DBQUOTEDSTRING, QUOTEDSTRING])).to('string'), function (scope) {
                return ast.expr.string(scope.string.slice(1, scope.string.length - 1));
            }).
            addRule(bind(this.E('operator')).to('ident'), function (scope) {
                return ast.expr.ident(scope.ident);
            }).
            addRule(bind(this.E('ident')).to('ident'), function (scope) {
                return ast.expr.ident(scope.ident);
            }).
            addRule(["[", commit([bind(this.E("exprs")).to('expr'),
                                  bind(rep(["for", this.E('ident'), "in", this.E("exprs")])).to('iterations'),
                                  bind(optrep(["if", this.E("exprs")])).to('conditions'), "]"])], function (scope) {
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
            addRule(["(", bind(this.E("exprs")).to("exprs"), ")"], function (scope) {
                return scope.exprs;
            }).
            addRule(["{", bind(this.E("exprs")).to("exprs"), "}"], function (scope) {
                return scope.exprs;
            }).
            addRule(["$", bind(this.E("exprs")).to("exprs")], function (scope) {
                return scope.exprs;
            }).
            addRule(["(", ")"], function () {
                return ast.expr.unit();
            }).
            addRule(["{", "}"], function () {
                return ast.expr.unit();
            }).
            addRule(["let", bind(IDENT).to('ident'), opt([":", bind(this.E("generics")).to("generics"), bind(this.E("types")).to('type')]), 
                     commit(bind(this.E("let-body")).to("body"))], function (scope) {
                var variableType;
                if (scope.hasOwnProperty("type")) {
                    variableType = ast.type.forall(scope.generics, scope.type);
                }
                return scope.body(scope.ident, variableType);
            });

        this.parser.group('let-body').
            addRule(["=", bind(this.E('exprs')).to('expr'), "in", bind(this.E('exprs')).to('body')], function (scope) {
                return function (ident, type) { return ast.expr.let(ident, scope.expr, scope.body, type); };
            });

        this.parser.group("fun-body").
            addRule([bind(rep([this.E("ident"), opt([":", this.E("generics"), this.E("type")])])).to('idents') ,"->",
                     bind(this.E('exprs')).to('body')], function (scope) {
                var result = scope.body;

                scope.idents.reverse().forEach(function (ident) {
                    var variableType;
                    
                    if (ident[1].length > 0) {
                        variableType = ast.type.forall(ident[1][0][1], ident[1][0][2]);
                    }

                    result = ast.expr.abstraction(ident[0], result, variableType);
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
