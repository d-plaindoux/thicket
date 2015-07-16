/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var reflect = require('../../../Data/reflect.js');
    
    // 
    // Module
    // 
    
    function Module(namespace, imports, entities) {
        this.$type = reflect.typeof(this);        
        this.namespace = namespace;
        this.imports = imports;
        this.entities = entities;
    }
    
    function Entity(name, definition) {
        this.$type = reflect.typeof(this);        
        this.name = name;
        this.definition = definition;
    }
    
    // 
    // Importations
    //
    
    function Imports(namespace, names) {
        this.$type = reflect.typeof(this);        
        this.namespace = namespace;
        this.names = names;
    }
    
    //
    // Expression definition
    //
    
    function Expression(name, type, expr) {
        this.$type = reflect.typeof(this);        
        this.name = name;
        this.type = type;
        this.expr = expr;
    }    
    
    //
    // Typedef definition
    //
    
    function Typedef(name, variables, type) {
        this.$type = reflect.typeof(this);        
        this.name = name;
        this.variables = variables;
        this.type = type;
    }
    
    //
    // Model definition
    //
    
    function Model(name, variables, params, parent, abstract) {
        this.$type = reflect.typeof(this);        
        this.name = name;
        this.variables = variables;
        this.params = params;
        this.parent = parent;
        this.abstract = abstract;
    }
    
    function Param(name, type) {
        this.$type = reflect.typeof(this);        
        this.name = name;
        this.type = type;
    }
    
    //
    // Type definition
    //

    function TypePolymorphic(variables, type) {
        this.$type = reflect.typeof(this);        
        this.variables = variables;
        this.type = type;
    }
    
    function TypeSpecialize(type, parameters) {
        this.$type = reflect.typeof(this);        
        this.type = type;
        this.parameters = parameters;
    }

    function TypeNative(name) {
        this.$type = reflect.typeof(this);        
        this.name = name;
    }

    function TypeVariable(name) {
        this.$type = reflect.typeof(this);        
        this.name = name;
    }
    
    function TypeFunction(argument,result) {
        this.$type = reflect.typeof(this);        
        this.argument = argument;
        this.result = result;
    }
        
    //
    // Controller definition
    //
    
    function Controller(name, variables, param, specifications, behaviors) {
        this.$type = reflect.typeof(this);        
        this.name = name;
        this.variables = variables;
        this.param = param;
        this.specifications = specifications;
        this.behaviors = behaviors;
    }
    
    //
    // Method definition and specification
    //
    
    function Method(name, caller, definition) {
        this.$type = reflect.typeof(this);        
        this.name = name;
        this.caller = caller;
        this.definition = definition;            
    }
    
    //
    // Expression definition
    //
    
    function NumberExpr(value) {
        this.$type = reflect.typeof(this);        
        this.value = value;
    }
    
    function StringExpr(value) {
        this.$type = reflect.typeof(this);        
        this.value = value;
    }
    
    function UnitExpr() {
        this.$type = reflect.typeof(this);        
    }

    function IdentExpr(value) {
        this.$type = reflect.typeof(this);        
        this.value = value;
    }

    function InvokeExpr(caller, name) {
        this.$type = reflect.typeof(this);        
        this.caller = caller;
        this.name = name;
    }
    
    function PairExpr(left, right) {
        this.$type = reflect.typeof(this);        
        this.left = left;
        this.right = right;
    }
    
    function ApplicationExpr(abstraction, argument) {
        this.$type = reflect.typeof(this);        
        this.abstraction = abstraction;
        this.argument = argument;
    }
    
    function ComprehensionExpr(value,iterations,conditions) {
        this.$type = reflect.typeof(this);        
        this.iterations = iterations;
        this.conditions = conditions;
        this.value = value;
    }
    
    function TagExpr(name,attributes,body) {
        this.$type = reflect.typeof(this);        
        this.name = name;
        this.attributes = attributes;
        this.body = body;
    }
    
    function LetExpr(name,type,value,body) {
        this.$type = reflect.typeof(this);        
        this.name = name;
        this.type = type;
        this.value = value;
        this.body = body;
    }
    
    function AbstractionExpr(param, type, body) {
        this.$type = reflect.typeof(this);        
        this.param = param;
        this.type = type;        
        this.body = body;            
    }
    
    function NewModelExpr(expr, alter) {
        this.$type = reflect.typeof(this);        
        this.model = expr;
        this.alter = alter;
    }
            
    //
    // AST constructors
    //
    
    return {
        module : function (namespace, imports, entities) { return new Module(namespace, imports, entities); },
        entity : function (name, definition) { return new Entity(name, definition); },
        imports : function (namespace, entitiesName) { return new Imports(namespace, entitiesName); }, 
        typedef : function (name, variables, type) { return new Typedef(name, variables, type); },
        model : function (name, variables, params, parent, abstract) { return new Model(name, variables, params, parent, abstract); },
        controller : function (name, variables, param, specifications, behaviors) { return new Controller(name, variables, param, specifications, behaviors); },
        expression : function (name, type, expr) { return new Expression(name, type, expr); },
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
            number : function (value) { return new NumberExpr(value); },
            string : function (value) { return new StringExpr(value); },
            unit : function () { return new UnitExpr(); },
            ident : function (name) { return new IdentExpr(name); },
            invoke : function (caller, name) { return new InvokeExpr(caller, name); },
            pair : function (left, right) { return new PairExpr(left, right); },
            application : function (abstraction, argument) { return new ApplicationExpr(abstraction, argument); },
            comprehension: function (value,iterations,condition) { return new ComprehensionExpr(value,iterations,condition); },
            tag: function (name, attributes, body) { return new TagExpr(name, attributes, body); },
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
        }
    };
}());
 
