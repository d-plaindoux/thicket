/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports.ast = (function () {
    
    'use strict';
    
    var reflect = require('../../Data/reflect.js').reflect;
    
    //
    // Typedef definition
    //
    
    function Typedef(name, variables, type) {
        this.name = name;
        this.variables = variables;
        this.type = type;
    }
    
    Typedef.prototype.toString = function() {
        if (this.variables.length > 0) {
            return this.name + "[" + this.variables.join(' ') + "]";
        }
        return this.name;
    };
    
    //
    // Model definition
    //
    
    function Model(name, variables, params, parent, abstract) {
        this.name = name;
        this.variables = variables;
        this.params = params;
        this.parent = parent;
        this.abstract = abstract;
    }
    
    Model.prototype.toString = function() {
        if (this.variables.length > 0) {
            return this.name + "[" + this.variables.join(' ') + "]";
        }
        return this.name;
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
        switch (reflect.typeof(this.type)) {
            case 'Model':
            case 'Controller':
            case 'View':
                return this.type.name;            
            default:
                return "[" + this.variables.join(' ') + "] " + this.type;
        }
    };
    
    function TypeSpecialize(type, parameters) {
        this.$type = "specialization";
        this.type = type;
        this.parameters = parameters;
    }
    
    TypeSpecialize.prototype.toString = function () {
        return this.type + "[" + this.parameters.join(' ') + "]";
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
        return "'" + this.name;
    };
    
    function TypeFunction(argument,result) {
        this.$type = "function";
        this.argument = argument;
        this.result = result;
    }
    
    TypeFunction.prototype.toString = function () {
        return "(" + this.argument + " -> " + this.result + ")";
    };
        
    //
    // Controller definition
    //
    
    function Controller(name, variables, param, specifications, behaviors) {
        this.name = name;
        this.variables = variables;
        this.param = param;
        this.specifications = specifications;
        this.behaviors = behaviors;
    }
    
    Controller.prototype.toString = function() {
        if (this.variables.length > 0) {
            return this.name + "[" + this.variables.join(' ') + "]";
        }
        return this.name;
    };
    

    //
    // View definition
    //
    
    function View(name, variables, param, body) {
        this.name = name;
        this.variables = variables;
        this.param = param;
        this.body = body;
    }
    
    View.prototype.toString = function() {
        if (this.variables.length > 0) {
            return this.name + "[" + this.variables.join(' ') + "]";
        }
        return this.name;
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
    
    NumberExpr.prototype.toString = function () {
        return this.value;  
    };
    
    function StringExpr(value) {
        this.$type = "string";
        this.value = value;
    }
    
    StringExpr.prototype.toString = function () {
        return this.value;  
    };
    
    function IdentExpr(value) {
        this.$type = "ident";
        this.value = value;
    }

    IdentExpr.prototype.toString = function () {
        return this.value;  
    };
    
    function InvokeExpr(caller, name) {
        this.$type = "invoke";
        this.caller = caller;
        this.name = name;
    }

    InvokeExpr.prototype.toString = function () {
        return '(' + this.caller + ').' + this.name;  
    };
    
    function PairExpr(left, right) {
        this.$type = "pair";
        this.left = left;
        this.right = right;
    }

    PairExpr.prototype.toString = function () {
        return '(' + this.left + ',' + this.right + ')';  
    };
    
    function ApplicationExpr(abstraction, argument) {
        this.$type = "apply";
        this.abstraction = abstraction;
        this.argument = argument;
    }

    ApplicationExpr.prototype.toString = function () {
        return this.abstraction + ' ' + this.argument;  
    };
    
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
    
    UnitExpr.prototype.toString = function () {
        return '()';
    };
    
    function LetExpr(name,type,value,body) {
        this.$type = "let";
        this.name = name;
        this.type = type;
        this.value = value;
        this.body = body;
    }
    
    function AbstractionExpr(param, type, body) {
        this.$type = "abstraction";
        this.param = param;
        this.type = type;        
        this.body = body;            
    }
    
    AbstractionExpr.prototype.toString = function () {
        return '(fun ' + this.param + (this.type?":"+this.type:"") + ' -> ' + this.body + ')';
    };
            
    //
    // AST constructors
    //
    
    return {
        typedef : function (name, variables, type) { return new Typedef(name, variables, type); },
        model : function (name, variables, params, parent, abstract) { return new Model(name, variables, params, parent, abstract); },
        controller : function (name, variables, param, specifications, behaviors) { return new Controller(name, variables, param, specifications, behaviors); },
        view : function (name, variables, param, body) { return new View(name, variables, param, body); },
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
            ident : function (name) { return new IdentExpr(name); },
            invoke : function (caller, name) { return new InvokeExpr(caller, name); },
            pair : function (left, right) { return new PairExpr(left, right); },
            application : function (abstraction, argument) { return new ApplicationExpr(abstraction, argument); },
            comprehension: function (value,iterations,condition) { return new ComprehensionExpr(value,iterations,condition); },
            tag: function (name, attributes, body) { return new TagExpr(name, attributes, body); },
            unit : function () { return new UnitExpr(); },
            let: function (name,value,body,type) { return new LetExpr(name,type,value,body); },
            abstraction: function (argument, body, type) { return new AbstractionExpr(argument, type, body); },
        },
        located : function (object, location) {
            object.location = location;
            return object;
        }
    };
}());
 