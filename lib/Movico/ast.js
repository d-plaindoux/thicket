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
    
    function TypeIdent(name) {
        this.name = name;
    }
    
    function TypeArray(type) {
        this.type = type;
    }
    
    function TypePair(left,right) {
        this.left = left;
        this.right = right;
    }
    
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

    function ApplicationExpr(exprs) {
        this.exprs = exprs;
    }

    function ComprehensionExpr(exprs,iterations,condition) {
        this.exprs = exprs;
        this.iterations = iterations;
        this.condition = condition;
    }

    function TagExpr(name,attributes,body) {
        this.name = name;
        this.attributes = attributes;
        this.body = body;
    }

    function UnitExpr() {
    }
    
    //
    // AST constructors
    //
    
    return {
        model : function (name, params) { return new Model(name, params); },
        controller : function (name, param, behaviors) { return new Controller(name, param, behaviors); },
        view : function (name, param, body) { return new View(name, param, body); },
        param : function (name, type) { return new Param(name, type); },
        method : function (name, params, body) { return new Method(name, params, body); },
        type: {
            ident : function (name) { return new TypeIdent(name); },
            array : function (type) { return new TypeArray(type); },
            pair : function (left,right) { return new TypePair(left,right); },            
        },
        expr : {
            number : function (value) { return new NumberExpr(value); },
            string : function (value) { return new StringExpr(value); },
            ident : function (name) { return new IdentExpr(name); },
            instance : function (name, params) { return new InstanceExpr(name, params); },
            invoke : function (caller, body) { return new InvokeExpr(caller, body); },
            pair : function (left, right) { return new PairExpr(left, right); },
            application : function (exprs) { return new ApplicationExpr(exprs); },
            comprehension: function (exprs,iterations,condition) { return new ComprehensionExpr(exprs,iterations,condition); },
            tag: function (name, attributes, body) { return new TagExpr(name, attributes, body); },
            unit : function () { return new UnitExpr(); }
        }
    };
}());
 