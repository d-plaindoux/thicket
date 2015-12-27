/* global document*/

/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function(runtime) {
    
    'use strict';

    var $i = runtime.instruction; 

    runtime.native("string.toDom", 1, function(env) {
        var name = runtime.constant(env.pop());
        
        return [[ $i.CONST, document.createTextNode(name) ]];
    });

    runtime.native("document.elementById", 3, function(env){
        var name = runtime.constant(env.pop()),
            aSome = env.pop(),
            aNone = env.pop(),  
            // Computed value
            node = document.getElementById(name);
        
        if (node) {
            return [[ $i.RESULT, aSome ], [ $i.CONST, node ], [ $i.APPLY ]];
        } else {
            return [[ $i.RESULT, aNone ]];
        }
    });
    
    runtime.native("document.createElement", 1, function(env){
        var name = runtime.constant(env.pop());

        return [[ $i.CONST, document.createElement(name) ]];
    });

    runtime.native("dom.elementById", 3, function(env){
        var self = runtime.constant(env.pop()),
            name = runtime.constant(env.pop()),            
            aSome = env.pop(),
            aNone = env.pop(),  
            // Computed value
            node = self.getElementById(name);
            
        
        if (node) {
            return [[ $i.RESULT, aSome ], [ $i.CONST, node ], [ $i.APPLY ]];
        } else {
            return [[ $i.RESULT, aNone ]];
        }
    });
    
    runtime.native("dom.setAttribute", 3, function(env){
        var self = env.pop(),
            name = runtime.constant(env.pop()),
            value = runtime.constant(env.pop()),
            // Computed value
            node = runtime.constant(self);

        node.setAttribute(name, value);
        
        return [[ $i.RESULT, self ]];
    });

    runtime.native("dom.getAttribute", 4, function(env){
        var self = env.pop(),
            name = runtime.constant(env.pop()),
            aSome = env.pop(),
            aNone = env.pop(),          
            // Computed value
            node = runtime.constant(self),
            value = node.getAttribute(name);
        
        if (node) {
            return [[ $i.RESULT, aSome ], [ $i.CONST, value], [ $i.APPLY ]];
        } else {
            return [[ $i.RESULT, aNone ]];
        }
    });

    runtime.native("dom.resetAttribute", 2, function(env){
        var self = env.pop(),
            name = runtime.constant(env.pop()),
            // Computed value
            node = runtime.constant(self);

        node.removeAttribute(name);
        
        return [[ $i.RESULT, self ]];
    });

    runtime.native("dom.getValue", 3, function(env){
        var node = runtime.constant(env.pop()),
            aSome = env.pop(),
            aNone = env.pop();

        if (node.value) {
            return [[ $i.RESULT, aSome ], [ $i.CONST, node.value ], [ $i.APPLY ]];
        } else {
            return [[ $i.RESULT, aNone ]];
        }
    });

    runtime.native("dom.onMouseEvent", 3, function(env){
        var self = env.pop(),
            event = runtime.constant(env.pop()),
            value = env.pop(),
            // Computed value
            node = runtime.constant(self);
        
        node.addEventListener(event, function () {
            return runtime.execute([[ $i.RESULT, value ], [ $i.CONST, node ], [ $i.APPLY ]]);
        });
        
        return [[ $i.RESULT, self ]];
    });    
    
    runtime.native("dom.onKeyEvent", 3, function(env){
        var self = env.pop(),
            event = runtime.constant(env.pop()),
            value = env.pop(),
            // Computed value
            node = runtime.constant(self);
        
        node.addEventListener(event, function (evt) {            
            var keyCode = evt.keyCode;
            return runtime.execute([[ $i.RESULT, value ], [ $i.CONST, node ], [ $i.APPLY ], [ $i.CONST, keyCode ], [ $i.APPLY ]]);
        });
        
        return [[ $i.RESULT, self ]];
    });    
    
    runtime.native("dom.appendChild", 2, function(env){
        function addChild(node, child) {
            var value = runtime.constant(child);
            
            if (runtime.getType(value) === 'Array') {
                value.forEach(function(child) {
                    addChild(node, child);
                });
            } else {
                node.appendChild(value);
            }            
        }
        
        var self = env.pop(),
            child = env.pop(),
            // Computed value
            node = runtime.constant(self);

        addChild(node, child);

        return [[ $i.RESULT, self ]];
    });    
      
    runtime.native("dom.removeChilds", 1, function(env){
        var self = env.pop(),
            // Computed value
            node = runtime.constant(self);
        
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }  

        return [[ $i.RESULT, self ]];
    });
            
    runtime.native("dom.clone", 1, function(env){
        var node = runtime.constant(env.pop());

        return [[  $i.CONST, node.cloneNode(true) ]];
    });

    runtime.native("dom.remove", 1, function(env){
        var self = env.pop(),
            // Computed value
            node = runtime.constant(self);

        node.parentNode.removeChild(node);
        
        return [[ $i.RESULT, self ]];
    });

    runtime.native("dom.replace", 2, function(env){
        var node = runtime.constant(env.pop()),
            newSelf = env.pop(),
            // Computed value
            newNode = runtime.constant(newSelf);
        
        if (node.parentNode) {
            node.parentNode.replaceChild(newNode,node);
        }
        
        return [[ $i.RESULT, newSelf ]];
    });
    
};
 