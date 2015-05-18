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
                        return JSON.stringify(code.CONST);
                    case 'MODEL':
                    case 'CLASS':
                        name = code[type][0];

                        if (name === "unit") {
                            return "()";
                        }

                        return "<" + type.toLowerCase() + " " + name + ">";
                    case 'NATIVE':
                        return "<NATIVE '" + code.NATIVE[0] + "'>";
                    default:
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

    Thicket.prototype.pretty = pretty(true);
    
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
        return this.eval(t).OBJ[1].CONST;
    };

    Thicket.prototype.native0 = function(name, arity, value) {
        this.delta[name] = [ { "NATIVE" : [name,arity,value] } ].concat([{RETURN:1}]);
    };
    
    Thicket.prototype.native = function(name, arity, value) {
        // self closure implicit evaluation
        this.delta[name] = close(arity,[ { "NATIVE" : [name,arity,value] } ]).concat([{RETURN:1}]);
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

    Thicket.prototype.execute = function(toExecute, debug) {
        return this.__execute(toExecute,[],debug);
    };
    
    Thicket.prototype.eval = function(code, debug) {
        if (code.hasOwnProperty("LAZY_ENV")) {
            var lazyCode = code.LAZY_ENV;
            if (!lazyCode[2]) {
                lazyCode[2] = this.__execute(lazyCode[0].LAZY.slice(), lazyCode[1].slice(), false);
            }
            
            return lazyCode[2];
        } 
          
        return code;
    };    

    //
    // [DISCLAIMER] Lazy evaluation is not yet efficient / done using sub abstract machine for the moment
    //
    
    Thicket.prototype.__execute = function(toExecute, initialEnv, debug) {
        var code = toExecute,
            env = initialEnv,
            stack = [];

        while (code.length > 0) {
            
            if (debug) {
                console.log("===".red);
                console.log("CODE  ".green + code.map(pretty(false)).join("; "));
                console.log("ENV   ".green + env.map(pretty(false)).join("; "));
                console.log("STACK ".green + stack.map(pretty(false)).join("; "));
            }
            
            var current = code.shift(), v, c, e;

            switch(getInstruction(current)) {
                case 'RESULT': // For native result !?
                    stack.unshift(current.RESULT);
                    break;
                case "NATIVE":
                    code = current.NATIVE[2](env.slice(0,current.NATIVE[1])).concat(code);
                    break;
                case "MODEL":                      
                    stack.unshift({OBJ:[current, env.slice(0,current.MODEL[1].length)]});
                    break;                    
                case "CLASS":
                    stack.unshift({OBJ:[current, this.eval(env[0],debug)]});
                    break;                    
                case "VIEW": 
                    code = current.VIEW[1].concat(code);
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
                    stack.unshift({ENV:[current.CLOSURE.slice(), env.slice()]});
                    break;                    
                case "INVOKE":
                    v = current.INVOKE;
                    c = this.eval(stack.shift());
                    stack.unshift(env);
                    stack.unshift(code);
                    if (isClassInstance(c.OBJ[0])) {
                        code = this.lookupMethod(c.OBJ[0], c.OBJ[1], v).slice();
                        env = [];
                        env.unshift(c.OBJ[1]);
                        env.unshift({OBJ:[c.OBJ[0], c.OBJ[1]]});
                    } else {
                        code = this.lookupAttribute(c.OBJ[0], v).slice();
                        env = c.OBJ[1].slice();
                    }
                    break;
                case "APPLY":
                    v = stack.shift();
                    c = this.eval(stack.shift());
                    stack.unshift(env);
                    stack.unshift(code);
                    code = c.ENV[0];
                    env = c.ENV[1];
                    env.unshift(v);
                    break;
                case "TAILAPPLY":
                    v = stack.shift();
                    c = this.eval(stack.shift());
                    code = c.ENV[0];
                    env = c.ENV[1];
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
                    stack.unshift({LAZY_ENV:[current, env.slice()]});
                    break;
                default:
                    throw new Error("Runtime error while executing instruction " + getInstruction(current));
            }
        }
        
        if (debug) {
            console.log("===".red);
            console.log("CODE  ".blue + code.map(pretty(false)).join(","));
            console.log("ENV   ".blue + env.map(pretty(false)).join(","));
            console.log("STACK ".blue + stack.map(pretty(false)).join(","));
        }

        return this.eval(stack.shift());
    };
    
    return new Thicket();    
}());
