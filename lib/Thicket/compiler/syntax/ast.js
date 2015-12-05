/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var list = require('../../../Data/list.js');
    
    // 
    // Module
    // 
    
    function Module(namespace, imports, entities, sentences) {
        this.$t = "Module";
        this.namespace = namespace;
        this.imports = imports;
        this.entities = entities;
        this.sentences = sentences || [];
    }
    
    function Entity(name, definition) {
        this.$t = "Entity";
        this.name = name;
        this.definition = definition;
    }
    
    function Sentence(definition) {
        this.$t = "Sentence";
        this.definition = definition;
    }
    
    // 
    // Importations
    //
    
    function Imports(namespace, names) {
        this.$t = "Imports";
        this.namespace = namespace;
        this.names = names;
    }
    
    //
    // Expression definition
    //
    
    function Expression(name, type, expr) {
        this.$t = "Expression";
        this.name = name;
        this.type = type;
        this.expr = expr;
    }    
    
    //
    // Typedef definition
    //
    
    function Typedef(name, variables, type) {
        this.$t = "Typedef";
        this.name = name;
        this.variables = variables;
        this.type = type;
    }
    
    //
    // Model definition
    //
    
    function Model(name, variables, params, parent, abstract) {
        this.$t = "Model";
        this.name = name;
        this.variables = variables;
        this.params = params;
        this.parent = parent;
        this.abstract = abstract;
    }
    
    function Param(name, type) {
        this.$t = "Param";
        this.name = name;
        this.type = type;
    }
    
    //
    // Type definition
    //

    function TypePolymorphic(variables, type) {
        this.$t = "TypePolymorphic";
        this.variables = variables;
        this.type = type;
    }
    
    function TypeSpecialize(type, parameters) {
        this.$t = "TypeSpecialize";
        this.type = type;
        this.parameters = parameters;
    }

    function TypeNative(name) {
        this.$t = "TypeNative";
        this.name = name;
    }

    function TypeVariable(name) {
        this.$t = "TypeVariable";
        this.name = name;
    }

    function TypeFunction(argument,result) {
        this.$t = "TypeFunction";
        this.argument = argument;
        this.result = result;
    }
        
    //
    // Trait definition
    //
    
    function Trait(name, variables, specifications, behaviors, derivations) {
        this.$t = "Trait";
        this.name = name;
        this.variables = variables;
        this.specifications = specifications;
        this.behaviors = behaviors;
        this.derivations = derivations || [];
    }
        
    //
    // Controller definition
    //
    
    function Controller(name, variables, param, specifications, behaviors, derivations) {
        this.$t = "Controller";
        this.name = name;
        this.variables = variables;
        this.param = param;
        this.specifications = specifications;
        this.behaviors = behaviors;
        this.derivations = derivations || [];
    }
    
    //
    // Entity Specialization
    //
    
    function EntitySpecialization(type, parameters) {
        this.$t = "EntitySpecialization";
        this.type = type;
        this.parameters = parameters;
    }
    
    //
    // Method definition and specification
    //
    
    function Method(name, caller, definition) {
        this.$t = "Method";
        this.name = name;
        this.caller = caller;
        this.definition = definition;            
    }
    
    //
    // Expression definition
    //

    function NativeExpr(value) {
        this.$t = "NativeExpr";
        this.value = value;
    }

    function IdentExpr(value) {
        this.$t = "IdentExpr";
        this.value = value;
    }

    function InvokeExpr(caller, name) {
        this.$t = "InvokeExpr";
        this.caller = caller;
        this.name = name;
    }
    
    function ApplicationExpr(abstraction, argument) {
        this.$t = "ApplicationExpr";
        this.abstraction = abstraction;
        this.argument = argument;
    }
    
    function LetExpr(name,type,value,body) {
        this.$t = "LetExpr";
        this.name = name;
        this.type = type;
        this.value = value;
        this.body = body;
    }
    
    function AbstractionExpr(param, type, body) {
        this.$t = "AbstractionExpr";
        this.param = param;
        this.type = type;        
        this.body = body;            
    }
    
    function NewModelExpr(expr, alter) {
        this.$t = "NewModelExpr";
        this.model = expr;
        this.alter = alter;
    }
      
    //
    // Normalized expressions dedicated to Number, String , Unit, Pair, Comprehension and Tag
    // 
    
    function abstraction(n,b) {
        return new AbstractionExpr(new IdentExpr(n), null, b);
    }
        
    function number(n) {
        return new ApplicationExpr(new IdentExpr("number"), new NativeExpr(n));
    }
        
    function string(n) {
        return new ApplicationExpr(new IdentExpr("string"), new NativeExpr(n));
    }
        
    function character(n) {
        return new ApplicationExpr(new IdentExpr("char"), new NativeExpr(n));
    }
        
    function unit() {
        return new IdentExpr("unit");
    }    

    function pair(left, right) {
        // (1,2) === Pair 1 2

        return new ApplicationExpr(new ApplicationExpr(new IdentExpr("Pair"), left), right);
    }
            
    function comprehension(value, allIterations, conditions) {
        // for a <- La b <- Lb if C1 yield p === La flatmap (a -> Lb filter (b -> C1) map (b -> p))
        
        var riterations = allIterations.reverse(), 
            iteration = riterations[0],
            iterations = riterations.slice(1),
            newExpression;
        
        newExpression = list(conditions).foldL(iteration[1], function(expression, condition) {
            return new ApplicationExpr(new InvokeExpr(expression,"filter"),
                                       new AbstractionExpr(iteration[0], null, condition));
        });
            
        newExpression = new ApplicationExpr(new InvokeExpr(newExpression, "map"),
                                             new AbstractionExpr(iteration[0], null, value));
        
        newExpression = list(iterations).foldL(newExpression, function (expression, iteration) {
            return new ApplicationExpr(new InvokeExpr(iteration[1], "flatmap"),
                                        new AbstractionExpr(iteration[0], null, expression));
        });
        
        return newExpression;
    }
    
    function attributeValue(expression, attribute) {
        var newExpression = expression;
        
        if (attribute[2] /* optional */) {
            newExpression = new InvokeExpr(newExpression, "addOptionalAttribute");
        } else {
            newExpression = new InvokeExpr(newExpression, "addAttribute");
        }

        newExpression = new ApplicationExpr(newExpression, string(attribute[0]));
        newExpression = new ApplicationExpr(newExpression, attribute[1]);

        return newExpression;
    }
            
    function tag(name, attributes, body) {
        var newExpression;
        
        // <A a1=v1 > 1 </A> === document "A" create addAttribute "a1" v1 addChild 1
        // <A a1?=v1 > 1 </A> === document "A" create addOptionalAttribute "a1" v1 addChild 1
        // <A a1=v1 if c > 1 </A> === document "A" create onCondition c (s -> s addAttribute "a1" v1) addChild 1
        // <A a1?=v1 if c > 1 </A> === document "A" create onCondition c (s -> s addOptionalAttribute "a1" v1) addChild 1

        newExpression = new IdentExpr("document");
        newExpression = new ApplicationExpr(newExpression, string(name));
        newExpression = new InvokeExpr(newExpression,"create");

        attributes.map(function(attribute) {
            if (attribute[3] /* conditional */) {
                newExpression = new InvokeExpr(newExpression, "onCondition");
                newExpression = new ApplicationExpr(newExpression, attribute[3]);
                newExpression = new ApplicationExpr(newExpression,
                                                    new AbstractionExpr("$1", null, attributeValue(new IdentExpr("$1"), attribute)));
            } else {        
                newExpression = attributeValue(newExpression, attribute);
            }
        });

        body.map(function(body) {
            newExpression = new InvokeExpr(newExpression, "addChilds");
            newExpression = new ApplicationExpr(newExpression, body);
        });
        
        return newExpression;
    }
    
    //
    // AST constructors
    //
    
    return {
        module : function (namespace, imports, entities, sentences) { return new Module(namespace, imports, entities, sentences); },
        entity : function (name, definition) { return new Entity(name, definition); },
        sentence : function (definition) { return new Sentence(definition); },
        imports : function (namespace, entitiesName) { return new Imports(namespace, entitiesName); }, 
        typedef : function (name, variables, type) { return new Typedef(name, variables, type); },
        model : function (name, variables, params, parent, abstract) { return new Model(name, variables, params, parent, abstract); },
        trait : function (name, variables, specifications, behaviors, derivations) { return new Trait(name, variables, specifications, behaviors, derivations); },
        controller : function (name, variables, param, specifications, behaviors, derivations) { return new Controller(name, variables, param, specifications, behaviors, derivations); },
        expression : function (name, type, expr) { return new Expression(name, type, expr); },
        specialization : function (type, parameters) { if (parameters.length === 0) { return type; } else { return new EntitySpecialization(type, parameters); } },
        param : function (name, type) { return new Param(name, type); },
        method : function (name, expression, caller) { return new Method(name, caller, expression); },
        type: {
            forall: function (variables, type) { if (variables.length === 0) { return type; } else { return new TypePolymorphic(variables, type); } },
            specialize : function (type, parameters) { if (parameters.length === 0) { return type; } else { return new TypeSpecialize(type, parameters); } },
            abstraction : function (argument,result) { return new TypeFunction(argument, result); },
            native : function (name) { return new TypeNative(name); },
            variable : function (name) { return new TypeVariable(name); },
            list : function (type) { return new TypeSpecialize(new TypeVariable("List"),[type]); },
            pair : function (left,right) { return new TypeSpecialize(new TypeVariable("Pair"),[left, right]); }
        },
        expr : {
            number : function (n) { return number(n); }, 
            string : function (n) { return string(n); }, 
            character : function (n) { return character(n); }, 
            unit : function () { return unit(); }, 
            ident : function (name) { return new IdentExpr(name); },
            invoke : function (caller, name) { return new InvokeExpr(caller, name); },
            pair : function (left, right) { return pair(left, right); },
            application : function (abstraction, argument) { return new ApplicationExpr(abstraction, argument); },
            comprehension: function (value,iterations,conditions) { return comprehension(value,iterations,conditions); },
            tag: function (name, attributes, body) { return tag(name, attributes, body); },
            let: function (name,value,body,type) { return new LetExpr(name,type,value,body); },
            abstraction: function (argument, body, type) { return new AbstractionExpr(argument, type, body); },
            newModel: function(model, alter) { return new NewModelExpr(model, alter); }
        },
        relocate : function (object, oldobject) {
            if (oldobject.$location) {
                object.$location = oldobject.$location;
            }
            
            return object;
        },
        locate : function (object, location) {
            object.$location = location;
            return object;
        },
        namespace : function (object, namespace) {
            object.namespace = namespace;
            return object;
        },
        adapter : function (object) {
            object.adapter = true;
            return object;
        },
        adapted : function (object, adapterName) {
            object.adapted = adapterName;
            return object;
        },
    };
}());
 
