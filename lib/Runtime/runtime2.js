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
        this.delta = {};
    }
    
    function isClassInstance(value) {
        switch (getInstruction(value)) {
            case "CLASS":
                return true;
        }
        
        // Fallback
        
        return false;
    }
    
    function getModelName(struct) {
        if (struct instanceof Array) {
            return getModelName(struct[0]);
        }
        
        var type = getInstruction(struct);        
        return type ? struct[type][0] : type;
    }
    
    function getInstruction(struct) {
        if (struct instanceof Object) {
            return Object.keys(struct)[0];
        } else {
            return null;
        }
    }
    
    function close(i, t) {
        if (i <= 0) {
            return t;
        }
        
        return [ { CLOSURE : close(i - 1, t.concat([{RETURN:1}])) } ];
    }
    
    Thicket.prototype.extendWith = function (extension) {
        extension(this);        
        return this;
    };
    
    Thicket.prototype.lookupMethod = function(value, model, name) {
        var type = getInstruction(value), 
            modelName = getModelName(model);
        
        switch (type) {
            case "CLASS":
                var entries = []; 
                
                // First system definition
                if (this.delta.hasOwnProperty(value[type][0] + "." + name)) {
                    entries = [[ this.delta[value[type][0] + "." + name] ]]; 
                }
                
                // Second specific method for named models
                if (entries.length === 0 && modelName) {
                    entries = value[type][1].filter(function (entry) {
                        if (entry[0] === modelName + "." + name) {
                            return entry[1];
                        }
                    });
                }
                
                // Third general method
                if (entries.length === 0) {
                    entries = value[type][1].filter(function (entry) {
                        if (entry[0] === name) {
                            return entry[1];
                        }
                    });
                }
                
                if (entries.length === 0) {
                    console.log(JSON.stringify(value[type][1]));
                    throw new Error("Method " + name + " not found in " + value[type][0]);
                }
                
                return entries[0][1];
        }
        
        // Fallback
        
        throw new Error("Invocation of " + name + " impossible with " + value[type] + " data");
    };
    
    Thicket.prototype.lookupAttribute = function(value, name) {
        var type = getInstruction(value);
        
        switch (type) {
            case "MODEL":
                var entries = value[type][1].filter(function (entry) {
                    if (entry[0] === name) {
                        return entry[1];
                    }
                });
                
                if (entries.length === 0) {
                    console.log(JSON.stringify(value[type][1]));
                    throw new Error("Attribute " + name + " not found in " + value[type][0]);
                }
                
                return entries[0][1];
        }
        
        // Fallback
        
        throw new Error("Definition " + name + " not found in " + value[type]);
    };
    
    Thicket.prototype.native = function(name, arity, value) {
        this.delta[name] = close(arity,[ { "NATIVE" : value } ]);
    };
    
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
            case "CLASS":
                this.define(current.CLASS[0], close(1, [current]));
                break;
            case "VIEW":
                this.define(current.VIEW[0], close(1, [current]));
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
                case "NATIVE":
                    code.NATIVE(stack);
                    break;
                case "MODEL":
                case "CLASS":
                    stack.unshift([current, env.slice()]);
                    break;                    
                case "VIEW":
                    code = current.VIEW[1].concat(code);
                    break;                                        
                case "DEFINITION":
                    code = current.DEFINITION[1].concat(code);
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
                    v = current.INVOKE;
                    c = stack.shift();
                    if (isClassInstance(c[0])) {
                        stack.unshift([this.lookupMethod(c[0], c[1][0], v).slice(), c[1].slice()]);
                        stack.unshift([{IDENT:c[0].CLASS[0]}, c[1]]);
                        code = [{APPLY:1}].concat(code);
                    } else {
                        stack.unshift(env);
                        stack.unshift(code);
                        code = this.lookupAttribute(c[0], v).slice();
                        env = c[1];
                    }
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
                case "LAZY":   
                    code = current.LAZY.concat(code);
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
    
    Thicket.prototype.pretty = function (result) {
        console.log(JSON.stringify(result));
        
        if (result instanceof Array) {
            var type = getInstruction(result[0]);
            switch (type) {
                case 'MODEL':
                case 'CLASS':
                    var name = result[0][type][0];
                    if (["number","string"].indexOf(name) !== -1) {
                        return this.pretty(result[1][0]);
                    } else {
                        return "<" + type.toLowerCase() + " " + name + ">";
                    }
                    return JSON.stringify(result);
                default:
                    return "<function>";                    
            }
        } else if (getInstruction(result) === 'CONST') {
            return JSON.stringify(result.CONST);
        }
        
        return JSON.stringify(result);
    };
    
    return new Thicket();    
}());
