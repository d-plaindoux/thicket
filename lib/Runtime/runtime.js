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
        
        return [ { CLOSURE : close(i - 1, t).concat([{RETURN:1}]) } ];
    }
    
    Thicket.prototype.extendWith = function (extension) {
        extension(this);        
        return this;
    };
    
    Thicket.prototype.lookupMethod = function(value, model, name) {
        switch (getInstruction(value)) {
            case "CLASS":
                var entries = [],
                    className = value.CLASS[0],
                    methods = value.CLASS[1],
                    modelName = getModelName(model);

                // Second specific method for named models
                if (entries.length === 0 && modelName) {
                    entries = methods.filter(function (entry) {
                        if (entry[0] === modelName + "." + name) {
                            return entry[1];
                        }
                    });
                }
                
                // Third general method
                if (entries.length === 0) {
                    entries = methods.filter(function (entry) {
                        if (entry[0] === name) {
                            return entry[1];
                        }
                    });
                }
                
                // Last system definition
                if (entries.length === 0 && this.delta.hasOwnProperty(className + "." + name)) {
                    entries = [[ "_" , this.delta[className + "." + name] ]]; 
                }
                

                if (entries.length === 0) {
                    throw new Error("Method " + name + " not found in " + className);
                }
                
                return entries[0][1];
        }
        
        // Fallback
        
        throw new Error("Invocation of " + name + " impossible with " + this.pretty(value) + " data");
    };
    
    Thicket.prototype.lookupAttribute = function(value, name) {
        switch (getInstruction(value)) {
            case "MODEL":
                var entries = [],
                    modelName = value.MODEL[0],
                    methods = value.MODEL[1];                    
                
                entries = methods.filter(function (entry) {
                    if (entry[0] === name) {
                        return entry[1];
                    }
                });
                
                if (entries.length === 0) {
                    throw new Error("Attribute " + name + " not found in " + modelName);
                }
                
                return entries[0][1];
        }
        
        // Fallback
        
        throw new Error("Definition " + name + " not found in " + this.pretty(value));
    };
    
    Thicket.prototype.constant = function(t) {
        return t[1][0].CONST;
    };

    Thicket.prototype.native = function(name, arity, value) {
        // self closure implicit evaluation
        this.delta[name] = close(arity,[ { "NATIVE" : value } ]).concat([{RETURN:1}]);
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
        
            var current = code.shift(), v, c, e;
            
            switch(getInstruction(current)) {
                case "NATIVE":
                    code = current.NATIVE(env).concat(code);
                    break;
                case "MODEL":                    
                    // Optimize the environment if possible
                    stack.unshift([current, env.slice(env.length-current.MODEL[1].length, env.length)]);
                    break;                    
                case "CLASS":
                    stack.unshift([current, [env[0]]]);
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
                    stack.unshift(env);
                    stack.unshift(code);
                    if (isClassInstance(c[0])) {
                        code = this.lookupMethod(c[0], c[1][0], v).slice();
                        env = c[1].slice();
                        env.unshift([c[0], c[1]]); // self -- [CLASS, this]
                    } else {
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
                    // stack.unshift([current, env.slice()]);
                    code = current.LAZY.concat(code);
                    break;
            }
        }

        return stack.shift();
    };
    
    Thicket.prototype.pretty = function (result) {
        var that = this, type, name;
        
        if (result instanceof Array) {
            type = getInstruction(result[0]);

            switch (type) {
                case 'MODEL':
                case 'CLASS':
                    name = result[0][type][0];

                    if (["number","string"].indexOf(name) !== -1) {
                        return this.pretty(result[1][0]);
                    }
                    
                    return "<" + type.toLowerCase() + " " + name + ">";
            }
        
            return result.map(function(c) { return that.pretty(c); }).join(",") + "]";
        } else {        
            type = getInstruction(result);

            switch (type) {
                case 'CONST':
                    return JSON.stringify(result.CONST);
                case 'MODEL':
                case 'CLASS':
                    name = result[type][0];

                    if (name === "unit") {
                        return "()";
                    }

                    return name;
                case 'NATIVE':
                    return "<native>";
                case 'CLOSURE':
                    return '{"CLOSURE": ' + this.pretty(result.CLOSURE) + '}';
                default:
                    return JSON.stringify(result);
            }
        }
    };
    
    return new Thicket();    
}());
