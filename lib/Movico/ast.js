/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.ast = (function () {
    
    'use strict';
    
    //
    // Model definition
    //
    
    function Model(name, generics, variables, params, parent) {
        this.name = name;
        this.generics = generics;
        this.variables = variables;
        this.params = params;
        this.parent = parent;
    }
    
    Model.prototype.clone = function () {
        return new Model(this.name, this.generics, this.variables, this.params, this.parent);
    };
    
    Model.prototype.toString = function() {
        if (this.variables.length > 0) {
            return "model " + this.name + "[" + this.variables.join(', ') + "]";
        }
        return "model " + this.name;
    };
    
    function Param(name, type) {
        this.name = name;
        this.type = type;
    }
    
    //
    // Type definition
    //
    
    function TypePolymorphic(variables, type) {
        this.$type = "forall";
        this.variables = variables;
        this.type = type;
    }
    
    TypePolymorphic.prototype.toString = function () {
        return "forall " + this.variables.join(', ') + " in " + this.type;
    };
    
    function TypeSpecialize(type, parameters) {
        this.$type = "specialization";
        this.type = type;
        this.parameters = parameters;
    }
    
    TypeSpecialize.prototype.toString = function () {
        return this.type + "[" + this.parameters.join(', ') + "]";
    };

    function TypeNative(name) {
        this.$type = "native";
        this.name = name;
    }
    
    TypeNative.prototype.toString = function () {
        return this.name;
    };

    function TypeVariable(name) {
        this.$type = "variable";                
        this.name = name;
    }
    
    TypeVariable.prototype.toString = function () {
        return this.name;
    };
    
    function TypeFunction(argument,result) {
        this.$type = "function";
        this.argument = argument;
        this.result = result;
    }
    
    TypeFunction.prototype.toString = function () {
        return this.argument + " -> " + this.result;
    };
        
    //
    // Controller definition
    //
    
    function Controller(name, generics, variables, param, specifications, behaviors) {
        this.name = name;
        this.generics = generics;        
        this.variables = variables;
        this.param = param;
        this.specifications = specifications;
        this.behaviors = behaviors;
    }
    
    Controller.prototype.clone = function () {
        return new Controller(this.name, this.generics, this.variables, this.param, this.specifications, this.behaviors);
    };
    
    Controller.prototype.toString = function() {
        if (this.variables.length > 0) {
            return "class " + this.name + "[" + this.variables.join(', ') + "]";
        }
        return "class " + this.name;
    };
    

    //
    // View definition
    //
    
    function View(name, generics, variables, param, body) {
        this.name = name;
        this.generics = generics;
        this.variables = variables;
        this.param = param;
        this.body = body;
    }
    
    View.prototype.clone = function () {
        return new View(this.name, this.generics, this.variables, this.param, this.body);
    };
    
    View.prototype.toString = function() {
        if (this.variables.length > 0) {
            return "view " + this.name + "[" + this.variables.join(', ') + "]";
        }
        return "view " + this.name;
    };

    //
    // Method definition and specification
    //
    
    function Method(name, caller, definition) {
        this.name = name;
        this.caller = caller;
        this.definition = definition;            
    }
    
    //
    // Expression definition
    //
    
    function NumberExpr(value) {
        this.$type = "number";
        this.value = value;
    }
    
    function StringExpr(value) {
        this.$type = "string";
        this.value = value;
    }
    
    function IdentExpr(value) {
        this.$type = "ident";
        this.value = value;
    }

    function InvokeExpr(caller, name) {
        this.$type = "invoke";
        this.caller = caller;
        this.name = name;
    }

    function PairExpr(left, right) {
        this.$type = "pair";
        this.left = left;
        this.right = right;
    }

    function ApplicationExpr(abstraction, argument) {
        this.$type = "apply";
        this.abstraction = abstraction;
        this.argument = argument;
    }

    function ComprehensionExpr(value,iterations,conditions) {
        this.$type = "foreach";
        this.value = value;
        this.iterations = iterations;
        this.conditions = conditions;
    }

    function TagExpr(name,attributes,body) {
        this.$type = "tag";
        this.name = name;
        this.attributes = attributes;
        this.body = body;
    }

    function UnitExpr() {
        this.$type = "unit";        
    }
    
    function LetExpr(name,value,body) {
        this.$type = "let";
        this.name = name;
        this.value = value;
        this.body = body;
    }
    
    function AbstractionExpr(param, body) {
        this.$type = "abstraction";
        this.param = param;
        this.body = body;            
    }
        
    //
    // AST constructors
    //
    
    return {
        model : function (name, generics, variables, params, parent) { return new Model(name, generics, variables, params, parent); },
        controller : function (name, generics, variables, param, specifications, behaviors) { return new Controller(name, generics, variables, param, specifications, behaviors); },
        view : function (name, generics, variables, param, body) { return new View(name, generics, variables, param, body); },
        param : function (name, type) { return new Param(name, type); },
        method : function (name, expression, caller) { return new Method(name, caller, expression); },
        type: {
            forall: function (variables, type) { if (variables.length === 0) { return type; } else { return new TypePolymorphic(variables, type); } },
            specialize : function (type, parameters) { return new TypeSpecialize(type, parameters); },
            abstraction : function (argument,result) { return new TypeFunction(argument, result); },
            native : function (name) { return new TypeNative(name); },
            variable : function (name) { return new TypeVariable(name); },
            list : function (type) { return new TypeSpecialize(new TypeVariable("List"),[type]); },
            pair : function (left,right) { return new TypeSpecialize(new TypeVariable("Pair"),[left, right]); }
        },
        expr : {
            number : function (value) { return new NumberExpr(value); },
            string : function (value) { return new StringExpr(value); },
            ident : function (name) { return new IdentExpr(name); },
            invoke : function (caller, name) { return new InvokeExpr(caller, name); },
            pair : function (left, right) { return new PairExpr(left, right); },
            application : function (abstraction, argument) { return new ApplicationExpr(abstraction, argument); },
            comprehension: function (value,iterations,condition) { return new ComprehensionExpr(value,iterations,condition); },
            tag: function (name, attributes, body) { return new TagExpr(name, attributes, body); },
            unit : function () { return new UnitExpr(); },
            let: function (name,value,body) { return new LetExpr(name,value,body); },
            abstraction: function (argument, body) { return new AbstractionExpr(argument, body); },
        },
        located : function (object, location) {
            object.location = location;
            return object;
        }
    };
}());
 