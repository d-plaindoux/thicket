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
        switch (getInstruction(value)) {
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
        switch (getInstruction(value)) {
            case "CONTROLLER":
                return true;
        }
        
        // Fallback
        
        return false;
    }
    
    function getInstruction(struct) {
        return Object.keys(struct)[0];
    }
            
    function close(i, t) {
        if (i <= 0) {
            return t;
        }
        
        return [ { CLOSURE : close(i - 1, t.concat([{RETURN:1}])) } ];
    }
    
    Thicket.prototype.define = function(name, value) {
        this.idents[name] = value;
    };
    
    Thicket.prototype.find = function(name) {
        var value = this.idents[name];
        if (value) {
            return value;
        }
        
        throw new Error("Definition not found for " + name);
    };
    
    Thicket.prototype.register = function(current) {
        switch(getInstruction(current)) {
            case "MODEL":
                this.define(current.MODEL[0], close(current.MODEL[1].length, [current]));
                break;
            case "CONTROLLER":
                this.define(current.CONTROLLER[0], close(1, [current]));
                break;
            case "VIEW":
                this.define(current.VIEW[0], [current]);
                break;
            case "DEFINITION":
                this.define(current.DEFINITION[0], [current]);
                break;
        }
    };
    
    Thicket.prototype.execute = function(toExecute) {
        var code = toExecute,
            env = [],
            stack = [];
        
        while (code.length > 0) {
/*            
            console.log("======");
            console.log("CODE  " + JSON.stringify(code));
            console.log("ENV   " + JSON.stringify(env));
            console.log("STACK " + JSON.stringify(stack));        
*/            
            var current = code.shift(),
                v, c, e;
            
            switch(getInstruction(current)) {
                case "MODEL":
                case "CONTROLLER":
                case "VIEW":
                    stack.unshift([current, env.slice()]);
                    break;                    
                case "CONST":
                    stack.unshift(current);
                    break;                    
                case "IDENT":
                    code = this.find(current.IDENT).concat(code);
                    break;
                case "ACCESS":
                    stack.unshift(env[env.length-current.ACCESS]);
                    break;
                case "CLOSURE":
                    stack.unshift([current.CLOSURE.slice(), env.slice()]);
                    break;                    
                case "INVOKE":
                    // Same as APPLY but the resolution is different
                    v = stack.shift();
                    c = lookup(v, current.INVOKE);
                    if (closure(v)) {
                        env.unshift(v); // self 
                    }
                    code = c.concat(code);  // Inlining ?
                    break;
                case "APPLY":
                    v = stack.shift();
                    c = stack.shift();
                    stack.unshift(env);
                    stack.unshift(code);
                    code = c[0];
                    env = c[1];
                    env.unshift(v);
                    break;
                case "TAILAPPLY":
                    v = stack.shift();
                    c = stack.shift();
                    code = c[0];
                    env = c[1];
                    env.unshift(v);                    
                    break;
                case "RETURN":
                    v = stack.shift();
                    c = stack.shift();
                    e = stack.shift();
                    code = c;
                    env = e;
                    stack.unshift(v);
                    break;
                case "TAG":
                    // -> Must be replaced by functional code
                    break;
                case "LAZY":   
                    code = current.LAZY.slice().concat(code);
                    break;
            }
        }
/*       
        console.log("======");
        console.log("CODE  " + JSON.stringify(code));
        console.log("ENV   " + JSON.stringify(env));
        console.log("STACK " + JSON.stringify(stack));        
*/
        return stack.shift();
    };
    
    return new Thicket();
    
}());
