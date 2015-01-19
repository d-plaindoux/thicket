/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.compiler = (function () {
    
    'use strict';
    
    function compileModel(model) {        
        console.log('function Model' + model.name + ' (' + model.params.map(function (p) { return p.name; }).join(',') + ') {');
        if (model.params.length > 0) {
            console.log('\t' + model.params.map(function (p) { return "this." + p.name + " = " + p.name + ";"; }).join('\n\t'));
        }
        console.log('}');
    }
    
    function compileController(controller) {        
        console.log('function Controller' + controller.name + ' (' + controller.param.name + ') {');
        console.log('}');
    }
    
    function compileView(view) {        
        console.log('function Controller' + view.name + ' (' + view.param.name + ') {');
        console.log('}');
    }
    
    return {
        model : compileModel,
        controller: compileController,
        view: compileView
    };

}());