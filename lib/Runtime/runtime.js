/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    "use strict";
    
    // ------------------------------------------------------------------------------------------------
    // Public bahaviors
    // ------------------------------------------------------------------------------------------------
    
    function isClassInstance(value) {
        switch (getInstruction(value)) {
            case "CLASS":
                return true;
        }
        
        // Fallback
        
        return false;
    }
    
    function getModelName(struct) {
        if (struct.hasOwnProperty('OBJ')) {
            return getModelName(struct.OBJ[0]);
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
    
    function pretty(render) {
        return function(code ) {
            var type, name;

            if (code instanceof Array) {
                type = getInstruction(code[0]);

                if (render) {
                    switch (type) {
                        case 'OBJ':
                            return pretty(render)(code.OBJ);
                        case 'MODEL':
                        case 'CLASS':
                            name = code[0][type][0];

                            if (["number","string"].indexOf(name) !== -1) {
                                return pretty(render)(code[1]);
                            }

                            return "<" + type.toLowerCase() + " " + name + ">";
                    }
                }

                return "[" + code.map(pretty(render)).join(",") + "]";
            } else {        
                type = getInstruction(code);

                switch (type) {
                    case 'CONST':
                        if (typeof code.CONST === 'number') {
                            return code.CONST;
                        }
                        return JSON.stringify(code.CONST);
                    case 'MODEL':
                    case 'CLASS':
                        name = code[type][0];

                        if (render && name === "unit") {
                            return "()";
                        }

                        if (render && ["number","string"].indexOf(name) !== -1) {
                            return pretty(render)(code[1]);
                        }

                        return "<" + type.toLowerCase() + " " + name + ">";
                    case 'NATIVE':
                        return "<NATIVE '" + code.NATIVE[0] + "'>";
                    case 'LAZY_ENV':
                        if (code.LAZY_ENV.LAZY_VALUE) {
                            return "<LAZY_VAL " + pretty(render)(code.LAZY_ENV[0].LAZY_VALUE) + ">";
                        }
                        
                        return "<LAZY_ENV ...>";
                    default:
                        if (render && ('OBJ' === type)) {
                            return pretty(render)(code.OBJ);
                        }

                        if (render && (['CLOSURE','ENV'].indexOf(type) !== -1)) {
                            return "<function>";                        
                        }
                        if (type) {
                            return "<" + type + " " + pretty(render)(code[type]) + ">";
                        } else {
                            return JSON.stringify(code);
                        }
                }
            }
        };
    }
    
    function getType(o) {
        if (typeof(o) === 'object') {
            var matched = o.constructor.toString(o).match(/^function\s(.*)\(/);
            if (matched) {
                return matched[1];
            }
			
            return "object";
        } else {
            return typeof(o);
        }
    }
    
    // ------------------------------------------------------------------------------------------------
    // constructor
    // ------------------------------------------------------------------------------------------------
    
    function Runtime() {
        this.debug = false;
        this.idents = {};
        this.delta = {};
        
        this.cache = {};
    }
        
    // ------------------------------------------------------------------------------------------------
    // Public behaviors
    // ------------------------------------------------------------------------------------------------
    
    Runtime.prototype.getType = getType;
    
    Runtime.prototype.setDebug = function(debug) {
        this.debug = debug;
        return this;
    };

    Runtime.prototype.pretty = pretty(true);
    
    Runtime.prototype.extendWith = function (extension) {
        extension(this);        
        return this;
    };
    
    Runtime.prototype.lookupMethod = function(value, model, name) {
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
    
    Runtime.prototype.lookupAttribute = function(value, name) {
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

    Runtime.prototype.constant = function(t) {        
        var value = this.executeIfLazy(t);
        
        if (value.hasOwnProperty('CONST')) {
            return value.CONST;
        } else if (value.hasOwnProperty('OBJ')) {
            return value.OBJ[1].CONST;
        }
        
        throw new Error("Value " + this.pretty(value) + " has no constant composant");
    };

    Runtime.prototype.native0 = function(name, arity, value) {
        this.delta[name] = [ { "NATIVE" : [name,arity,value] } ];
    };
    
    Runtime.prototype.native = function(name, arity, value) {
        // self closure implicit evaluation
        if (this.delta.hasOwnProperty(name)) {
            throw new Error("Native method " + name + " aleady exist");
        }
        
        this.delta[name] = close(arity,[ { "NATIVE" : [name,arity,value] } ]);
    };
    
    Runtime.prototype.define = function(name, value) {
        this.idents[name] = value;
    };
    
    Runtime.prototype.find = function(name) {
        var value = this.idents[name];
        if (value) {
            return value;
        }
        
        throw new Error("Definition not found for " + name);
    };
    
    Runtime.prototype.register = function(current) {
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

    Runtime.prototype.execute = function(toExecute) {
        return this.executeCode(toExecute,[]);
    };
    
    function checNull(code) {
        if (!code) {
            throw new Error("NULL");
        }
        
        return code;
    }
    
    Runtime.prototype.executeIfLazy = function(code) { 
        if (code.hasOwnProperty("LAZY_ENV")) {
            var lazyCode = code.LAZY_ENV;
            
            if (!code.LAZY_VAL) {
                code.LAZY_VAL = this.executeCode(lazyCode[0].LAZY.slice(), lazyCode[1]);
            }
            
            return code.LAZY_VAL;
        } 
          
        return code;
    };    

    //
    // [DISCLAIMER] Lazy evaluation is not yet efficient / done using sub abstract machine for the moment
    //
        
    Runtime.prototype.executeCode = function(toExecute, initialEnv) {
        var code = toExecute,
            env = initialEnv,
            stack = [];

        while (code.length > 0) {
            
            if (this.debug) {
                console.log("===");
                console.log("CODE  " + code.map(pretty(false)).join("; "));
                console.log("ENV   " + env.map(pretty(false)).join("; "));
                console.log("STACK " + stack.map(pretty(false)).join("; "));
            }
            
            var current = code.shift(), v, c, e;
            
            switch(getInstruction(current)) {
                case "RESULT": // For native result !?
                    stack.unshift(current.RESULT);
                    break;
                case "NATIVE":
                    code = current.NATIVE[2](env.slice(0,current.NATIVE[1])).concat([{RETURN:1}]).concat(code);
                    break;
                case "MODEL":                      
                    stack.unshift({OBJ:[current, env.slice(0,current.MODEL[1].length)]});
                    break;                    
                case "CLASS":
                    stack.unshift({OBJ:[current, this.executeIfLazy(env[0])]});
                    break;                    
                case "DEFINITION":
                    stack.unshift(env);
                    stack.unshift(code);                                 
                    code = current.DEFINITION[1].concat([{RETURN:1}]);
                    env = [];
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
                    stack.unshift({ENV:[current.CLOSURE, env.slice()]});
                    break;                    
                case "INVOKE":
                    v = current.INVOKE;
                    c = this.executeIfLazy(stack.shift());
                    stack.unshift(env);
                    stack.unshift(code);
                    if (!c.hasOwnProperty('OBJ')) {
                        console.log(pretty(true)(c));
                    }
                    if (isClassInstance(c.OBJ[0])) {
                        code = this.lookupMethod(c.OBJ[0], c.OBJ[1], v).concat([{RETURN:1}]).slice();
                        env = [];
                        env.unshift(c.OBJ[1]);
                        env.unshift({OBJ:[c.OBJ[0], c.OBJ[1]]});
                    } else {
                        code = this.lookupAttribute(c.OBJ[0], v).concat([{RETURN:1}]).slice();
                        env = c.OBJ[1].slice();
                    }
                    break;
                case "APPLY":
                    v = stack.shift();
                    c = this.executeIfLazy(stack.shift());
                    stack.unshift(env);
                    stack.unshift(code);
                    code = c.ENV[0].slice();
                    env = c.ENV[1].slice();
                    env.unshift(checNull(v));
                    break;
                case "TAILAPPLY":
                    v = stack.shift();
                    c = this.executeIfLazy(stack.shift());
                    code = c.ENV[0].slice();
                    env = c.ENV[1].slice();
                    env.unshift(checNull(v));                 
                    break;
                case "RETURN":
                    v = stack.shift();
                    c = stack.shift();
                    e = stack.shift();
                    code = c.slice();
                    env = e.slice();
                    stack.unshift(checNull(v));
                    break;
                case "LAZY":
                    stack.unshift({LAZY_ENV:[current, env.slice()]});
                    break;
                default:
                    throw new Error("Runtime error while executing instruction " + JSON.stringify(current));
            }
        }
        
        if (this.debug) {
            console.log("===");
            console.log("CODE  " + code.map(pretty(false)).join(","));
            console.log("ENV   " + env.map(pretty(false)).join(","));
            console.log("STACK " + stack.map(pretty(false)).join(","));
        }

        return this.executeIfLazy(stack.shift());
    };
    
    return new Runtime();    
}());
