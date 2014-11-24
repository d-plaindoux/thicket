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
    
    //
    // AST constructors
    //
    
    return {
        model : function (name, params) { return new Model(name, params); },
        param : function (name, type) { return new Param(name, type); },
        type  : function () { return new Type(); }
    };
}());
 