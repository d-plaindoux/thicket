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
    
    function CoupleExpr(left, right) {
        this.left = left;
        this.right = right;
    }
    
    function ApplicationExpr(exprs) {
        this.exprs = exprs;
    }
    
    //
    // AST constructors
    //
    
    return {
        controller : function (name, param, behaviors) { return new Controller(name, param, behaviors); },
        model : function (name, params) { return new Model(name, params); },
        param : function (name, type) { return new Param(name, type); },
        type : function () { return new Type(); },
        method : function (name, params, body) { return new Method(name, params, body); },
        number : function (value) { return new NumberExpr(value); },
        string : function (value) { return new StringExpr(value); },
        ident : function (name) { return new IdentExpr(name); },
        instance : function (name, params) { return new InstanceExpr(name, params); },
        invoke : function (caller, body) { return new InvokeExpr(caller, body); },
        couple : function (left, right) { return new CoupleExpr(left, right); },
        application : function (exprs) { return new ApplicationExpr(exprs); }
    };
}());
 