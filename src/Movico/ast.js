/*global exports, require*/

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
    
    Model.prototype.toString = function () {
        return "model " + this.name + " ...\n";
    };
    
    function Param(name, type) {
        this.name = name;
        this.type = type;
    }
    
    function Type() {
        // TODO
    }
    
    //
    // Controller definition
    //
    
    function Controller(name, param, behaviors) {
        this.name = name;
        this.param = param;
        this.behaviors = behaviors;
    }
    
    Controller.prototype.toString = function () {
        return "controller " + this.name + " ...\n";
    };
    
    //
    // View definition
    //
    
    function View(name, param, body) {
        this.name = name;
        this.param = param;
        this.body = body;
    }
    
    View.prototype.toString = function () {
        return "view " + this.name + "{" + this.body + "}\n";
    };
    
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
    
    NumberExpr.prototype.toString = function () {
        return this.value;
    };
    
    function StringExpr(value) {
        this.value = value;
    }
    
    StringExpr.prototype.toString = function () {
        return 'String{' + this.value + '}';
    };
    
    function IdentExpr(value) {
        this.value = value;
    }

    IdentExpr.prototype.toString = function () {
        return this.value;
    };

    function InstanceExpr(name, params) {
        this.name = name;
        this.params = params;
    }
    
    InstanceExpr.prototype.toString = function () {
        return this.name + "{ ... }";
    };    

    function InvokeExpr(caller, body) {
        this.caller = caller;
        this.body = body;
    }
    
    InvokeExpr.prototype.toString = function () {
        return this.caller + "." + this.body;
    };    

    function PairExpr(left, right) {
        this.left = left;
        this.right = right;
    }
    
    PairExpr.prototype.toString = function () {
        return "("  + this.left + "," + this.right + ")";
    };    

    function ApplicationExpr(exprs) {
        this.exprs = exprs;
    }
    
    ApplicationExpr.prototype.toString = function () {        
        return this.exprs.join(' ');
    };    

    function ComprehensionExpr(exprs,iterations,condition) {
        this.exprs = exprs;
        this.iterations = iterations;
        this.condition = condition;
    }
    
    ComprehensionExpr.prototype.toString = function () {
        return "[ ... ]";
    };    

    function TagExpr(name,attributes,body) {
        this.name = name;
        this.attributes = attributes;
        this.body = body;
    }
    
    TagExpr.prototype.toString = function () {
        return "<" + this.name + " ~ " + this.attributes.map(function (p) { return p[0] + "=" + p[1]; }).join(' ') +">" + this.body + "</" + this. name + ">";
    };    

    function UnitExpr() {
    }
    
    UnitExpr.prototype.toString = function () {
        return "()";
    };    

    //
    // AST constructors
    //
    
    return {
        model : function (name, params) { return new Model(name, params); },
        controller : function (name, param, behaviors) { return new Controller(name, param, behaviors); },
        view : function (name, param, body) { return new View(name, param, body); },
        param : function (name, type) { return new Param(name, type); },
        type : function () { return new Type(); },
        method : function (name, params, body) { return new Method(name, params, body); },
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
    };
}());
 