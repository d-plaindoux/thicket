/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    "use strict";
    
    function Thicket() {
        this.idents = {};
    }
       
    function lookup(value, name) {
        switch (keyOf(value)) {
            case "MODEL":
                return value[name];
            case "CONTROLLER":
                // Select using "this" instance name first !
                // -> "this" must be captured
                return value[name];
        }
        
        // Fallback
        
        return [];
    }
    
    function closure(value) {
        switch (keyOf(value)) {
            case "CONTROLLER":
                return true;
        }
        
        // Fallback
        
        return false;
    }
    
    function keyOf(struct) {
        return Object.keys(struct)[0];
    }
            
    function close(i, t) {
        if (i <= 0) {
            return t;
        }
        
        return [ { CLOSURE : close(i - 1, t) } ];
    }
    
    Thicket.prototype.executor = function(toExecute) {
        var code = toExecute,
            env = [],
            stack = [ this.unit ];
        
        while (code.length > 0) {
            var current = code.shift(),
                v, c, e;
            
            switch(keyOf(current)) {
                case "CONST":
                    stack.push(this.idents[current.CONST]);
                    break;                    
                case "IDENT":
                    code = code.concat(this.idents[current.IDENT]);
                    break;
                case "ACCESS":
                    stack.push(env[current.ACCESS-1]);
                    break;
                case "CLOSURE":
                    stack.push([current.CLOSURE,env.slice()]);
                    break;                    
                case "INVOKE":
                    v = stack.pop();
                    c = lookup(v, current.INVOKE);
                    if (closure(v)) {
                        env.push(v); // self 
                    }
                    code = c.concat(code);  // Inlining ?
                    break;
                case "APPLY":
                    v = stack.pop();
                    c = stack.pop();
                    stack.push(env);
                    stack.push(code);
                    code = c[0];
                    env = c[1];
                    env.push(v);
                    break;
                case "TAILAPPLY":
                    v = stack.pop();
                    c = stack.pop();
                    code = c[0];
                    env = c[1];
                    env.push(v);                    
                    break;
                case "RETURN":
                    v = stack.pop();
                    c = stack.pop();
                    e = stack.pop();
                    code = c;
                    env = e;
                    stack.push(v);
                    break;
                case "TAG":
                    // -> Must be replaced by functional code
                    break;
                case "LAZY":   
                    code = current.LAZY.concat(code);
                    break;
                case "MODEL":
                    this.idents[current.MODEL[0]] = close(current.MODEL[1].length, current);
                    break;
                case "CONTROLLER":
                    this.idents[current.CONTROLLER[0]] = close(1, current);
                    break;
                case "VIEW":
                    this.idents[current.VIEW[0]] = current;
                    break;
                case "DEFINITION":
                    this.idents[current.DEFINITION[0]] = current;                    
                    break;
            }
        }
        
        return stack.pop();
    };
    
    return new Thicket();
    
}());
