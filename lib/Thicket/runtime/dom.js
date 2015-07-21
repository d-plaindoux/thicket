/* global document*/

/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = function(runtime) {

    runtime.native("string.toDom", 1, function(env) {
        var name = runtime.constant(env.pop());
        
        return [ {CONST:document.createTextNode(name)} ];
    });

    runtime.native("dom.elementById", 3, function(env){
        var name = runtime.constant(env.pop()),
            aSome = env.pop(),
            aNone = env.pop(),  
            // Computed value
            node = document.getElementById(name);
        
        if (node) {
            return [ {RESULT:aSome},{CONST:node},{APPLY:1} ];
        } else {
            return [ {RESULT:aNone} ];
        }
    });
    
    runtime.native("dom.createElement", 1, function(env){
        var name = runtime.constant(env.pop());

        return [ {CONST:document.createElement(name)} ];
    });

    runtime.native("dom.setAttribute", 3, function(env){
        var self = env.pop(),
            name = runtime.constant(env.pop()),
            value = runtime.constant(env.pop()),
            // Computed value
            node = runtime.constant(self);

        node.setAttribute(name, value);
        
        return [ {RESULT:self} ];
    });
    
    runtime.native("dom.setFunction", 3, function(env){
        var self = env.pop(),
            name = runtime.constant(env.pop()),
            value = env.pop(),
            // Computed value
            node = runtime.constant(self);
        
        node.addEventListener(name, function () {
            return runtime.execute([ {RESULT:value},{CONST:node},{APPLY:1} ]);
        });
        
        return [ {RESULT:self} ];
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

        return [ {RESULT:self} ];
    });    
      
    runtime.native("dom.removeChilds", 1, function(env){
        var self = env.pop(),
            // Computed value
            node = runtime.constant(self);
        
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }  

        return [ {RESULT:self} ];
    });
            
    runtime.native("dom.clone", 1, function(env){
        var node = runtime.constant(env.pop());

        return [ {CONST:node.cloneNode()} ];
    });

    runtime.native("dom.remove", 2, function(env){
        var self = env.pop(),
            // Computed value
            node = runtime.constant(self);

        node.parentNode.removeChild(node);
        
        return [ {RESULT:self} ];
    });

    runtime.native("dom.replace", 2, function(env){
        var node = runtime.constant(env.pop()),
            newSelf = env.pop(),
            // Computed value
            newNode = runtime.constant(newSelf);
        
        node.parentNode().replaceChild(node,newNode);
        
        return [ {RESULT:newSelf} ];
    });
    
};
 