/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.ast = (function () {
    
    'use strict';
    
    //
    // Model definition
    //
    
    function Model(name, params) {
        this.name = name;
        this.params = params;
    }
    
    function Param(name, type) {
        this.name = name;
        this.type = type;
    }
    
    //
    // Type definition
    //
    
    function TypePolymorphic(variable, type) {
        this.$type = "forall";
        this.variable = variable;
        this.type = type;
        if (type === undefined) {
            throw new Error("???");
        }
    }
    
    TypePolymorphic.prototype.toString = function () {
        return "forall " + this.variable + " in " + this.type;
    };
    
    function TypeSpecialize(type, param) {
        this.$type = "specialization";
        this.type = type;
        this.param = param;
    }
    
    TypeSpecialize.prototype.toString = function () {
        return this.type + " " + this.param;
    };

    function TypeNative(name) {
        this.$type = "native";
        this.name = name;
    }
    
    TypeNative.prototype.toString = function () {
        return this.name;
    };

    function TypeVariable(name, specializations) {
        this.$type = "variable";                
        this.name = name;
        if (specializations) {
            this.specializations = specializations;
        } else {
            this.specializations = [];
        }
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
    
    function Controller(name, param, behaviors) {
        this.name = name;
        this.param = param;
        this.behaviors = behaviors;
    }
    
    //
    // View definition
    //
    
    function View(name, param, body) {
        this.name = name;
        this.param = param;
        this.body = body;
    }
    
    //
    // Method definition
    //
    
    function Method(name, expression) {
        this.name = name;
        this.expression = expression;            
        this.type = undefined;
        this.expected = [];
    }
        
    Method.prototype.setType = function (type) {
        this.type = type;
        return this;
    };
    
    Method.prototype.addExpected = function (type) {
        this.expected = this.expected.concat([type]);
        return this;
    };
    
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
    
    function PolymorphicExpr(variable, body) {
        this.$type = "forall";
        this.variable = variable;
        this.body = body;
    }
        
    //
    // AST constructors
    //
    
    return {
        model : function (name, params) { return new Model(name, params); },
        controller : function (name, param, behaviors) { return new Controller(name, param, behaviors); },
        view : function (name, param, body) { return new View(name, param, body); },
        param : function (name, type) { return new Param(name, type); },
        method : function (name, expression) { return new Method(name, expression); },
        type: {
            forall: function (variable, type) { return new TypePolymorphic(variable, type); },
            specialize : function (type, param) { return new TypeSpecialize(type, param); },
            abstraction : function (argument,result) { return new TypeFunction(argument, result); },
            native : function (name) { return new TypeNative(name); },
            variable : function (name) { return new TypeVariable(name); },
            array : function (type) { return new TypeSpecialize(new TypeVariable("Array"),type); },
            pair : function (left,right) { return new TypeSpecialize(new TypeSpecialize(new TypeVariable("Pair"),left), right); }
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
            abstraction: function (param, body) { return new AbstractionExpr(param, body); },
            forall: function (variable, body) { return new PolymorphicExpr(variable, body); } 
        },
        located : function (object, location) {
            object.location = location;
            return object;
        }
    };
}());
 