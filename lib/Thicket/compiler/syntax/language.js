/*global parseFloat*/

/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function () {

    'use strict';

    var parser = require('../../../Parser/parser.js'),
        bind = require('../../../Parser/bind.js'),
        eos = require('../../../Parser/eos.js'),
        opt = require('../../../Parser/opt.js'),
        optrep = require('../../../Parser/optrep.js'),
        rep = require('../../../Parser/rep.js'),
        choice = require('../../../Parser/choice.js'),
        commit = require('../../../Parser/commit.js'),
        ast  = require('./ast.js'),

        OPERATOR = /^([~$#?;:@&!%><=+*/|.^-]|\[|\])([~$#?;:@&!%><=+*/|_.^-]|\[|\])*/,
        SEPARATOR = [".", "(", ")", "{", "}", ",", '$"', "$", 
                     "<", ">", "/>", "</", "<-", "->", 
                     "=", "//", ":", ";;", "::", "$"],
        KEYWORDS = ["adapter", "module","from", "import", 
                    "typedef", "type", "trait", "model", "class", 
                    "def", "let", "in", "if", "for", "yield", 
                    "new", "with"],
        IDENT = /^[a-zA-Z_][a-zA-Z0-9_$]*/,
        XMLID = /^[a-zA-Z_][a-zA-Z0-9_$-]*/,
        NUMBER = /^\d+([.]\d+)?([eE][+-]?\d+)?/,
        HEXANUMBER = /^0x[0-9a-fA-F]+/,
        STRING = /^"([\\][0rtnf"]|[^"])*"/,
        INTERPOLATION = /^([\\][nrft"]|[^"$])+/,
        CHARACTER = /^'([\\][0rtnf']|[^'])'/,
        SPACES = /^\s+/,
        LINECOMMENT=/^\/\/[^\n]*\n?/,
        BLOCKCOMMENT=/^\/\*(.|\n)*?\*\//;

    function Language() {
        this.parser = parser();
            
        this.skip();
        this.ident();
        this.generics();
        this.interpolation();        
        this.module();
        this.source();
        this.moduleName();
        this.importations();
        this.entities();
        this.definition();
        this.adapter();
        this.types();
        this.model();
        this.controller();
        
        this.sentence();

        this.param();
        this.type();
        this.expression();
    }
    
    function locate(data,location) {
        function locateObject(data,location) {
            var key;
            
            for (key in data) {
                data[key] = locate(data[key], location);
            }
            
            return data;
        }
        
        if (!data) {
            return data;
        } else if (data.$location) {
            return data;
        } else if (data.$t) {
            return ast.locate(locateObject(data, location),location);
        } else {
            return data;
        }    
    }
    
    Language.prototype.locate = function () {
        this.parser.addLocationFn(locate);        
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

    Language.prototype.interpolation = function () {
        this.parser.group('interpolation').
            noSkip().
            addRule([bind(optrep(this.E("interpolation_item"))).to("interpolation"), '"', opt(SPACES)], function (scope) {
                var result = ast.expr.string("");
            
                scope.interpolation.forEach(function(interpolation) {
                    result = ast.expr.application(ast.expr.invoke(result,"+"), interpolation);
                });
            
                return result;
            });
        
        this.parser.group('interpolation_item').
            noSkip().
            addRule(bind(INTERPOLATION).to('interpolation'), function (scope) {
                return ast.expr.string(scope.interpolation                                      
                                       .replace(/\\"/g,'"')
                                       .replace(/\\n/g,'\n')
                                       .replace(/\\t/g,'\t')
                                       .replace(/\\r/g,'\r')
                                       .replace(/\\f/g,'\f')
                                       .replace(/\\0/g,'\0'));
            }).
            addRule(["$", bind(this.E("sexpr")).to('interpolation')], function (scope) {
                return scope.interpolation;
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
                return ast.module(scope.namespace, scope.source[0], scope.source[1], scope.source[2]);
            });
    };
    
    Language.prototype.source = function() {
        // Source toplevel -- Main entry
        this.parser.group("source").
            addRule([bind(this.E("importations")).to("importations"), 
                     bind(this.E("entities")).to("entities")], function (scope) {
                return [scope.importations, scope.entities[0], scope.entities[1]];
            });
    };
    
    Language.prototype.importations = function() {
        // importations
        this.parser.group("importations").
            addRule(bind(optrep(this.E("importationDef"))).to('importations'), function (scope) {
                return scope.importations;
            });
        
        this.parser.group("importationDef").
            addRule(["from", bind(this.E("moduleNameDef")).to("name"), 
                     "import", bind(this.E("importedItems")).to("names")], function (scope) {
                return ast.imports(scope.name, scope.names);
            }).
            addRule(["import", bind(this.E("moduleNameDef")).to("name")], function (scope) {
                return ast.imports(scope.name, undefined);
            });

        this.parser.group("importedItems").
            addRule("*", function () {
                return [];
            }).
            addRule([bind(this.E("methodName")).to("ident"), 
                     bind(optrep([",",this.E("methodName")])).to("idents")], function (scope) {
                var idents = [ scope.ident ];
                scope.idents.forEach(function(ident) {
                    idents = idents.concat([ident[1]]);
                });
                return idents;
            });
    };
    
    Language.prototype.moduleName = function () {
        this.parser.group("moduleNameDef").
            addRule([bind(this.E("ident")).to("ident"), bind(optrep([".",this.E("ident")])).to('idents')], function (scope) {        
                return [scope.ident].concat(scope.idents.map(function (ident) {
                    return ident[1];
                })).join('.');
            });        
    };

    Language.prototype.entities = function() {
        // entities
        this.parser.group("entities").
            addRule([bind(optrep(this.E("entityDef"))).to('elements'), eos], function (scope) {
                var entities = [], sentences = [];
                scope.elements.forEach(function(elements) {
                    elements.forEach(function (element) {
                        if (element.$t === 'Entity') {
                            entities = entities.concat(element);
                        } else {
                            sentences = sentences.concat(element);
                        }
                    });
                });
                return [entities,sentences];
            }).
            addRule([bind(opt(this.E("sentence"))).to('sentence')], function (scope) {
                return [[],scope.sentence];
            });
        
        // entityDef group
        this.parser.group("entityDef").        
            addRule(bind(this.E("adapterDef")).to('adapter'), function (scope) {
                return [ scope.adapter ];
            }).
            addRule(bind(this.E("typeDef")).to('type'), function (scope) {
                return [ scope.type ];
            }).
            addRule(bind(this.E("sortDef")).to('models'), function (scope) {
                return scope.models;
            }).
            addRule(bind(this.E("modelDef")).to('model'), function (scope) {
                return [ scope.model ];
            }).
            addRule(bind(this.E("traitDef")).to('trait'), function (scope) {
                return [ scope.trait ];
            }).
            addRule(bind(this.E("controllerDef")).to('controller'), function (scope) {
                return [ scope.controller ];
            }).
            addRule(bind(this.E("expressionDef")).to('expression'), function (scope) {
                return [ scope.expression ];
            }).
            addRule(bind(this.E("exprs")).to('sentence'), function (scope) {
                return [ ast.sentence(scope.sentence) ];
            });
    };

    Language.prototype.adapter = function() {
        // coercionDef
        this.parser.group("adapterDef").
            addRule(["def",
                     "adapter", 
                     bind(this.E('ident')).to("name"), ":" ,
                     bind(this.E("generics")).to("generics"),
                     bind(this.E("types")).to('type'),
                     "=", 
                     bind(this.E("def-body")).to('expr')], function (scope) {
            var entity = ast.entity(scope.name,
                                    ast.type.forall(scope.generics, 
                                                    ast.expression(scope.name, 
                                                                   scope.type, 
                                                                   scope.expr)));
            return ast.adapter(entity);
        });
    };
    
    Language.prototype.types = function () {
        // typeDef group
        this.parser.group("typeDef").
            addRule(["typedef", bind(this.E('ident')).to("name"), bind(this.E("generics")).to("generics1"),
                     "=", bind(this.E("generics")).to("generics2"), bind(this.E("types")).to('type')], function (scope) {
                var variables = scope.generics1.map(function (name) { return ast.type.variable(name); });
                return ast.entity(scope.name,
                                  ast.type.forall(scope.generics1, 
                                                  ast.typedef(scope.name, 
                                                              variables, 
                                                              ast.type.forall(scope.generics2, scope.type))));
            });

        this.parser.group("sortDef").
            addRule(["type", bind(this.E('ident')).to("name"), bind(this.E("generics")).to("generics"),
                     "{", bind(rep(this.E("simpleModelDef"))).to("models"), "}"], function (scope) {
                var variables = scope.generics.map(function (name) { return ast.type.variable(name); }),
                    names = scope.models.map(function (model) { return model.name; }),
                    parent = ast.model(scope.name, variables, [], undefined, names);

                return scope.models.map(function (model) {
                    model.definition.variables = variables;
                    model.definition.parent = parent;
                    return ast.entity(model.name,ast.type.forall(scope.generics, ast.specialization(model.definition, variables)));
                }).concat(ast.entity(scope.name,ast.type.forall(scope.generics, ast.specialization(parent, variables))));
            });

        this.parser.group("simpleModelDef").
            addRule([opt("model"), bind(this.E('methodName')).to("name"),
                     "{", commit([bind(optrep(this.E("tparam"))).to("params"), "}"])], function (scope) {
                return ast.entity(scope.name, ast.model(scope.name, [], scope.params));
            }).
            addRule([opt("model"), bind(this.E('methodName')).to("name")], function (scope) {
                return ast.entity(scope.name, ast.model(scope.name, [], []));
            });
    };

    Language.prototype.definition = function() {
        // expressionDef group
        this.parser.group("expressionDef").
            addRule(["def", bind(this.E('methodName')).to('name'), ":", 
                     commit([bind(this.E("generics")).to("generics"), bind(this.E("types")).to('type'), 
                             "=", 
                             bind(this.E("def-body")).to('expr')])], function (scope) {                
                return ast.entity(scope.name,ast.type.forall(scope.generics, ast.expression(scope.name, scope.type, scope.expr)));
            }).
            addRule(["def", bind(this.E('methodName')).to('name'), "=", 
                     bind(this.E("exprs")).to('expr')], function (scope) {                
                return ast.entity(scope.name,ast.expression(scope.name, null, scope.expr));
            });
    };
    
    Language.prototype.model = function () {
        // modelDef group
        this.parser.group("modelDef").
            addRule(["model", bind(this.E('methodName')).to("name"), bind(this.E("generics")).to("generics"),
                     "{", commit([bind(optrep(this.E("tparam"))).to("params"), "}"])], function (scope) {
                var variables = scope.generics.map(function (name) { return ast.type.variable(name); });
                return ast.entity(scope.name,ast.type.forall(scope.generics, 
                                                             ast.specialization(ast.model(scope.name, variables, scope.params),
                                                                                variables)));
            }).
            addRule(["model", bind(this.E('methodName')).to("name"), bind(this.E("generics")).to("generics")], function (scope) {
                var variables = scope.generics.map(function (name) { return ast.type.variable(name); });
                return ast.entity(scope.name,ast.type.forall(scope.generics, 
                                                             ast.specialization(ast.model(scope.name, variables, []),
                                                                                variables)));
            });
    };

    Language.prototype.controller = function () {
        // controllerDef group
        this.parser.group('traitDef').
            addRule(["trait", bind(this.E('methodName')).to('name'), bind(this.E("generics")).to("generics"),                     
                     "{", bind(optrep(this.E("methodSpec"))).to("specifications"), "}",
                     "{", bind(optrep(this.E("methodTrait"))).to('methods'), "}"], function (scope) {
                var variables = scope.generics.map(function (name) { return ast.type.variable(name); }),
                    specifications = scope.specifications.filter(function(specifications) {
                        return specifications[0];
                    }).map(function(specifications) { 
                        return specifications[0]; 
                    }),
                    derivations = scope.specifications.filter(function(specifications) {
                        return specifications[1];
                    }).map(function(specifications) { 
                        return specifications[1]; 
                    });
                         
                return ast.entity(scope.name,
                                  ast.type.forall(scope.generics, 
                                       ast.specialization(
                                            ast.trait(scope.name, 
                                                      variables,                                                  
                                                      specifications, 
                                                      scope.methods,
                                                      derivations),
                                            variables)));
            });
                     
        this.parser.group('methodTrait').
            addRule(["def", bind(this.E('methodName')).to('name'), ":", 
                     commit([bind(this.E("generics")).to("generics"), bind(this.E("types")).to('type'), 
                             "=", 
                             bind(this.E("exprs")).to('expr')])], function (scope) {                
            
                return ast.method(scope.name,scope.expr,null,ast.type.forall(scope.generics, scope.type));
            }).
            addRule(["def", bind(this.E('methodName')).to('name'), 
                     bind(optrep(this.E("ident"))).to('idents'), "=",
                     bind(this.E("exprs")).to('body')], function (scope) {
                var result = scope.body;

                scope.idents.reverse().forEach(function (ident) {
                    result = ast.expr.abstraction(ident[0], result);
                });

                return ast.method(scope.name, result);
            });
        
        this.parser.group('controllerDef').
            addRule(["class", bind(this.E('methodName')).to('name'), bind(this.E("generics")).to("generics"),
                     bind(this.E('ident')).to('that'), ":", bind(this.E("types")).to('type'),
                     "{", bind(optrep(this.E("methodSpec"))).to("specifications"), "}",
                     "{", bind(optrep(this.E("method"))).to('methods'), "}"], function (scope) {
                var variables = scope.generics.map(function (name) { return ast.type.variable(name); }),
                    specifications = scope.specifications.filter(function(specifications) {
                        return specifications[0];
                    }).map(function(specifications) { 
                        return specifications[0]; 
                    }),
                    derivations = scope.specifications.filter(function(specifications) {
                        return specifications[1];
                    }).map(function(specifications) { 
                        return specifications[1]; 
                    });
                         
                return ast.entity(scope.name,
                                  ast.type.forall(scope.generics, 
                                       ast.specialization(
                                            ast.controller(scope.name, 
                                                           variables, 
                                                           ast.param(scope.that, scope.type), 
                                                           specifications, 
                                                           scope.methods,
                                                           derivations),
                                            variables)));
            });
        
        this.parser.group('methodSpec').                    
            addRule([bind(opt("native")).to("native"), bind(this.E("tparam")).to("param")], function (scope) {
                return [ scope.param, null ];
            }).
            addRule(["with", bind(this.E("type")).to("type")], function (scope) {
                return [ null, scope.type ];
            });                    
                     
        this.parser.group('method').
            addRule(["def", bind(this.E('methodName')).to('name'), ":", 
                     commit([bind(this.E("generics")).to("generics"), bind(this.E("types")).to('type'), 
                             "=", 
                             bind(this.E("exprs")).to('expr')])], function (scope) {                
                return ast.method(scope.name,scope.expr, null, ast.type.forall(scope.generics, scope.type));
            }).
            addRule(["def", bind(opt([this.E("ident"), "."])).to("caller"), bind(this.E('methodName')).to('name'), 
                     bind(optrep([this.E("ident")])).to('idents'), "=",
                     bind(this.E("exprs")).to('body')], function (scope) {
                var result = scope.body;

                scope.idents.reverse().forEach(function (ident) {
                    result = ast.expr.abstraction(ident[0], result);
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
            }).
            addRule(["(", bind("[").to("ident"), ")"], function (scope) {
                return scope.ident;
            }).
            addRule(["(", bind("]").to("ident"), ")"], function (scope) {
                return scope.ident;
            });
    };

    Language.prototype.param = function () {
        // Params group
        this.parser.group('param').
            addRule([bind(this.E('ident')).to('name'), ":", bind(this.E("types")).to('type')], function (scope) {
                return ast.param(scope.name, scope.type);
            });

        this.parser.group('tparam').
            addRule([bind(this.E('methodName')).to('name'), 
                     ":", bind(this.E("generics")).to("generics"), bind(this.E("types")).to('type')], function (scope) {
                return ast.param(scope.name, ast.type.forall(scope.generics, scope.type));
            });
    };

    Language.prototype.type = function () {
        // Type and types groups
        this.parser.group('type').
            addRule(["(", commit([bind(this.E("types")).to('type'), ")"])], function (scope) {
                return scope.type;
            }).
            addRule([bind(this.E("generics")).to("generics"), bind(this.E("ident")).to("name"), bind(opt(["[", rep(this.E('types')), "]"])).to('params')], function (scope) {
                var result = ast.type.variable(scope.name);
                
                if (scope.params.length > 0) {
                    result = ast.type.specialize(result, scope.params[0][1]);
                }

                return ast.type.forall(scope.generics, result);
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

    Language.prototype.sentence = function () {
        this.parser.group('sentence').
            addRule([bind(this.E("exprs")).to("expr"), eos], function (scope) {
                return ast.sentence(scope.expr);
            });
    };
    
    Language.prototype.expression = function () {
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
            addRule([bind(this.E("type")).to('type'), "::", commit([bind(this.E('methodName')).to('name')])], function (scope) {
                return ast.expr.abstraction("main", ast.expr.invoke(ast.expr.ident("main"),scope.name), scope.type);
            }).            
            addRule([bind(this.E('fun-body')).to('body')], function (scope) {
                return scope.body;
            }).           
            addRule(bind(HEXANUMBER).to('number'), function (scope) {
                return ast.expr.number(parseInt(scope.number, 16));
            }).
            addRule(bind(NUMBER).to('number'), function (scope) {
                return ast.expr.number(parseFloat(scope.number, 10));
            }).
            addRule(bind(STRING).to('string'), function (scope) {
                return ast.expr.string(
                    scope.string.slice(1, scope.string.length - 1)
                                       .replace(/\\"/g,'"')
                                       .replace(/\\n/g,'\n')
                                       .replace(/\\t/g,'\t')
                                       .replace(/\\r/g,'\r')
                                       .replace(/\\f/g,'\f')
                                       .replace(/\\0/g,'\0')
                );
            }).
            addRule(bind(CHARACTER).to('character'), function (scope) {
                return ast.expr.character(
                    scope.character.slice(1, scope.character.length - 1)
                                       .replace(/\\'/g,'\'')
                                       .replace(/\\n/g,'\n')
                                       .replace(/\\t/g,'\t')
                                       .replace(/\\r/g,'\r')
                                       .replace(/\\f/g,'\f')
                                       .replace(/\\0/g,'\0')
                );
            }).
            addRule(['$"',commit(bind(this.E("interpolation")).to("interpolation"))], function (scope) {
                return scope.interpolation;
            }).
            addRule(bind(this.E('operator')).to('ident'), function (scope) {
                return ast.expr.ident(scope.ident);
            }).
            addRule(bind(this.E('ident')).to('ident'), function (scope) {
                return ast.expr.ident(scope.ident);
            }).
            addRule(["new", bind(this.E("exprs")).to("expr"), "with", 
                     bind(rep([this.E('methodName'), "=", this.E("expr")])).to("alter")], function (scope) {
                return ast.expr.newModel(scope.expr,scope.alter.map(function(e){ return [e[0],e[2]];}));
            }).
            addRule(["for",
                     bind(rep([this.E('ident'), "<-", this.E("expr")])).to('iterations'),
                     bind(optrep(["if", this.E("exprs")])).to('conditions'), 
                     "yield",bind(this.E("exprs")).to('expr')], function (scope) {
                return ast.expr.comprehension(scope.expr,
                                              scope.iterations.map(function (l) { return [l[0], l[2]]; }),
                                              scope.conditions.map(function (l) { return l[1]; })
                                             );
            }).
            addRule(["<", commit([bind(XMLID).to('sname'),
                                  bind(optrep([XMLID, opt([choice(['?=',"="]), this.E('expr')]), opt(["if", this.E("expr")])])).to('attributes'),
                                  bind(this.E("tag-body")).to("result")])], function (scope) {
                if (scope.result.hasOwnProperty('ename') && scope.sname !== scope.result.ename) {
                    return null;
                }

                return ast.expr.tag(scope.sname, 
                                    scope.attributes.map(function (l) { 
                                        var name      = l[0], 
                                            value     = l[1].length === 1 ? l[1][0][1] : ast.expr.string(""),
                                            optional  = l[1].length === 1 ? l[1][0][0]==='?=' : false,
                                            condition = l[2].length === 1 ? l[2][0][1] : null;
                                        return [name, value, optional, condition]; 
                                    }), 
                                    scope.result.body || []);
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
            addRule(["let", bind(IDENT).to('ident'), 
                     opt([":", bind(this.E("generics")).to("generics"), bind(this.E("types")).to('type')]), 
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
               
        this.parser.group("def-body").
            addRule([bind(rep([this.E("ident"), opt([":", this.E("generics"), this.E("type")])])).to('idents') ,"->",
                     bind(this.E('expr')).to('body')], function (scope) {
                var result = scope.body;

                scope.idents.reverse().forEach(function (ident) {
                    var variableType;
                    
                    if (ident[1].length > 0) {
                        variableType = ast.type.forall(ident[1][0][1], ident[1][0][2]);
                    }

                    result = ast.expr.abstraction(ident[0], result, variableType);
                });
                return result;
            }).
            addRule(bind(this.E('expr')).to('body'), function (scope) {
                return scope.body;
            });        

        this.parser.group('tag-body').
            addRule(["/>"], function (scope) {
                return scope;
            }).
            addRule([">", bind(optrep(this.E('expr'))).to('body'), "</", bind(XMLID).to('ename'), ">"], function (scope) {
                return scope;
            });
    };

    return new Language();
};
