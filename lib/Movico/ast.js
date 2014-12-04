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
    
    var option = require('../Data/option.js').option;
    
    //
    // Model definition
    //
    
    function Model(name, generics, params) {
        this.name = name;
        this.generics = generics;
        this.params = params;
    }
    
    function Param(name, type) {
        this.name = name;
        this.type = type;
    }
    
    //
    // Type definition
    //
    
    function TypeNative(name) {
        this.name = name;
    }
    
    TypeNative.prototype.toString = function () {
        return this.name;
    };

    function TypeIdent(name) {
        this.name = name;
    }
    
    TypeIdent.prototype.toString = function () {
        return this.name;
    };

    function TypeVariable(name) {
        this.name = name;
        this.reference = option.empty();
    }
    
    TypeVariable.prototype.bind = function (reference) {
        this.reference = option.some(reference);
        return this;
    };
    
    TypeVariable.prototype.toString = function () {
        return this.name;
    };

    function TypeArray(type) {
        this.type = type;
    }
    
    TypeArray.prototype.toString = function () {
        return "[" + this.type + "]";
    };

    
    function TypePair(first,second) {
        this.first = first;
        this.second = second;
    }
    
    TypePair.prototype.toString = function () {
        return "(" + this.first + "," + this.second + ")";
    };
    
    function TypeFunction(argument,result) {
        this.argument = argument;
        this.result = result;
    }
    
    TypeFunction.prototype.toString = function () {
        return this.argument + " -> " + this.result;
    };
        
    //
    // Controller definition
    //
    
    function Controller(name, generics, param, behaviors) {
        this.name = name;
        this.generics = generics;
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
    
    function Method(name, params, body) {
        this.name = name;
        this.params = params;
        this.body = body;            
    }
        
    //
    // Expression definition
    //
    
    function NumberExpr(value) {
        this.value = value;
    }
    
    function StringExpr(value) {
        this.value = value;
    }
    
    function IdentExpr(value) {
        this.value = value;
    }
    
    function InstanceExpr(name, params) {
        this.name = name;
        this.params = params;
    }

    function InvokeExpr(caller, body) {
        this.caller = caller;
        this.body = body;
    }

    function PairExpr(left, right) {
        this.left = left;
        this.right = right;
    }

    function ApplicationExpr(expressions) {
        this.expressions = expressions;
    }

    function ComprehensionExpr(value,iterations,conditions) {
        this.value = value;
        this.iterations = iterations;
        this.conditions = conditions;
    }

    function TagExpr(name,attributes,body) {
        this.name = name;
        this.attributes = attributes;
        this.body = body;
    }

    function UnitExpr() {
    }
    
    function LetExpr(name,value,body) {
        this.name = name;
        this.value = value;
        this.body = body;
    }
    
    function AbstractionExpr(params, body) {
        this.params = params;
        this.body = body;            
    }
    
    //
    // AST constructors
    //
    
    return {
        model : function (name, generics, params) { return new Model(name, generics, params); },
        controller : function (name, generics, param, behaviors) { return new Controller(name, generics, param, behaviors); },
        view : function (name, param, body) { return new View(name, param, body); },
        param : function (name, type) { return new Param(name, type); },
        method : function (name, abstraction) { return new Method(name, abstraction); },
        type: {
            native : function (name) { return new TypeNative(name); },
            ident : function (name) { return new TypeIdent(name); },
            variable : function (name) { return new TypeVariable(name); },
            array : function (type) { return new TypeArray(type); },
            pair : function (left,right) { return new TypePair(left, right); },
            abstraction : function (argument,result) { return new TypeFunction(argument, result); }
        },
        expr : {
            number : function (value) { return new NumberExpr(value); },
            string : function (value) { return new StringExpr(value); },
            ident : function (name) { return new IdentExpr(name); },
            instance : function (name, params) { return new InstanceExpr(name, params); },
            invoke : function (caller, body) { return new InvokeExpr(caller, body); },
            pair : function (left, right) { return new PairExpr(left, right); },
            application : function (expressions) { return new ApplicationExpr(expressions); },
            comprehension: function (value,iterations,condition) { return new ComprehensionExpr(value,iterations,condition); },
            tag: function (name, attributes, body) { return new TagExpr(name, attributes, body); },
            unit : function () { return new UnitExpr(); },
            let: function (name,value,body) { return new LetExpr(name,value,body); },
            abstraction: function (params, body) { return new AbstractionExpr(params, body); }
        },
        located : function (object, location) {
            object.location = location;
            return object;
        }
    };
}());
 