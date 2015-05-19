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
        var v1 = runtime.constant(env.pop());
        
        return [ {CONST:document.createTextNode(v1)} ];
    });

    runtime.native("dom.elementById", 3, function(env){
        var name = runtime.constant(env.pop()),
            aSome = env.pop(),
            aNone = env.pop(),  
            // Computed value
            node = document.getElementById(name);
        
        if (node) {
            return [ {RESULT:aSome}, {CONST:node}, {APPLY:1} ];
        } else {
            return [ {RESULT:aNone} ];
        }
    });
    
    runtime.native("dom.elementById", 1, function(env){
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
            node = runtime.constant(self),
            callback = "[ {RESULT:" + JSON.stringify(value) + "}, {CONST:dom}, {APPLY:1} ]";
            
        node.setAttribute(name, "function(dom) { ThicketRT.execute(" + callback + "); }");
        
        return [ {RESULT:self} ];
    });
    
    runtime.native("dom.appendChild", 2, function(env){
        var self = env.pop(),
            child = runtime.constant(env.pop()),
            // Computed value
            node = runtime.constant(self);

        if (runtime.getType(child) === 'Array') {
            child.forEach(function(child) {
                node.appendChild(runtime.constant(child));
            });
        } else {
            node.appendChild(child);
        }

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
 