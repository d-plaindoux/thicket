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
    // Private bahaviors
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
        this.external = {};
        this.delta = {};
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
                if (modelName) {
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
    
    Runtime.prototype.alterAttribute = function(value, name, alteration) {
        switch (getInstruction(value.OBJ[0])) {
            case "MODEL":
                var indice = -1,
                    methods = value.OBJ[0].MODEL[1],
                    values = value.OBJ[1];
                
                methods.map(function (entry, index) {
                    if (entry[0] === name) {
                        indice = index;
                    }
                });
                
                values = value.OBJ[1].map(function(v,index) {
                    if (indice === (value.OBJ[1].length - 1 - index)) {
                        return alteration;
                    } else {
                        return v;
                    }
                });
                
                return {'OBJ':[value.OBJ[0], values]};
        }
        
        // Fallback
        
        throw new Error("Definition " + name + " not found in " + getInstruction(value));
    };

    Runtime.prototype.native0 = function(name, arity, value) {
        this.delta[name] = [ { "NATIVE" : [name,arity] } ];
        this.external[name] = value;
    };
    
    Runtime.prototype.native = function(name, arity, value) {
        // self closure implicit evaluation
        if (this.delta.hasOwnProperty(name)) {
            throw new Error("Native method " + name + " aleady exist");
        }
        
        this.delta[name] = close(arity,[ { "NATIVE" : [name,arity] } ]);
        this.external[name] = value;
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
            case "DEFINITION":
                this.define(current.DEFINITION[0], [current]);
                break;
        }
    };

    function executionTrace(code, env, stack) {
        console.log("===");
        console.log("CODE  " + code.map(pretty(false)).join("; "));
        console.log("ENV   " + env.map(pretty(false)).join("; "));
        console.log("STACK " + stack.map(pretty(false)).join("; "));
    }
      
    Runtime.prototype.constant = function(value) {
        if (value.hasOwnProperty('CONST')) {
            return value.CONST;
        } else if (value.hasOwnProperty('OBJ')) {        
            return value.OBJ[1].CONST;
        }

        throw new Error("Value " + this.pretty(value) + " has no constant composant");
    };

    //
    // [DISCLAIMER] Lazy is done using sub abstract machine for the moment
    //              Implementation using PUSH and GRAB must be done ...
    //
    
    Runtime.prototype.executeNextCode = function(executionStack,code,env,stack) {
        var that = this;
        
        function executeWhenLazy (executionStack, code, continuation) {
            var stack = [];

            if (code.LAZY_ENV && code.LAZY_ENV[2]) {
                continuation(code.LAZY_ENV[2]);
            } else if (code.LAZY_ENV) {
                executionStack.unshift(function() {
                    code.LAZY_ENV[2] = stack.shift();
                    continuation(code.LAZY_ENV[2]);
                });
                executionStack.unshift(function(executionStack) {
                    that.executeNextCode(executionStack,
                                         code.LAZY_ENV[0].slice(), 
                                         code.LAZY_ENV[1].slice(),
                                         stack); 
                });
            } else {
                continuation(code);
            }
        }
        
        if (code.length > 0) {
            
            if (this.debug) {
                executionTrace(code, env, stack);
            }
            
            var current = code.shift(), n, v, c, e;
            
            switch(getInstruction(current)) {
                case "RESULT": // For native result !?
                    stack.unshift(current.RESULT);
                    break;
                case "NATIVE":
                    var parameters = [];
                    
                    executionStack.unshift(function(executionStack) {
                        code = that.external[current.NATIVE[0]](parameters).concat([{RETURN:1}]).concat(code);
                        that.executeNextCode(executionStack,code,env,stack); 
                    });
                    
                    env.slice(0,current.NATIVE[1]).forEach(function (param) {
                        executionStack.unshift(function(executionStack) {
                            return executeWhenLazy(executionStack, param, function(result) {
                                parameters.unshift(result);
                            });
                        });                          
                    });
                    return;
                case "MODEL":                      
                    stack.unshift({OBJ:[current, env.slice(0,current.MODEL[1].length)]});
                    break;                    
                case "CLASS":
                    executeWhenLazy(executionStack, env[0], function(result) {
                        stack.unshift({OBJ:[current, result]});
                        that.executeNextCode(executionStack,code,env,stack);
                    });
                    return;
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
                case "ALTER":
                    n = current.ALTER;
                    v = stack.shift();
                    executeWhenLazy(executionStack, stack.shift(), function(m) {
                        stack.unshift(that.alterAttribute(m,n,v));
                        that.executeNextCode(executionStack,code,env,stack);
                    });
                    return;                    
                case "INVOKE":
                    v = current.INVOKE;
                    c = stack.shift();
                    stack.unshift(env);
                    stack.unshift(code);
                    executeWhenLazy(executionStack, c, function(c) {
                        if (isClassInstance(c.OBJ[0])) {
                            code = that.lookupMethod(c.OBJ[0], c.OBJ[1], v).concat([{RETURN:1}]).slice();
                            env = [];
                            env.unshift(c.OBJ[1]);
                            env.unshift({OBJ:[c.OBJ[0], c.OBJ[1]]});
                        } else {
                            code = that.lookupAttribute(c.OBJ[0], v).concat([{RETURN:1}]).slice();
                            env = c.OBJ[1].slice();
                        }
                        that.executeNextCode(executionStack,code,env,stack);
                    });
                    return;
                case "APPLY":
                    v = stack.shift();
                    c = stack.shift();
                    stack.unshift(env);
                    stack.unshift(code);
                    executeWhenLazy(executionStack, c, function(c) {                        
                        code = c.ENV[0].slice();
                        env = c.ENV[1].slice();
                        env.unshift(v);
                        that.executeNextCode(executionStack,code,env,stack);
                    });
                    return;
                case "TAILAPPLY":
                    v = stack.shift();
                    c = stack.shift();
                    executeWhenLazy(executionStack, c, function(c) {                        
                        code = c.ENV[0].slice();
                        env = c.ENV[1].slice();
                        env.unshift(v);
                        that.executeNextCode(executionStack,code,env,stack);
                    });
                    return;
                case "RETURN":
                    v = stack.shift();
                    c = stack.shift();
                    e = stack.shift();
                    code = c.slice();
                    env = e.slice();
                    executeWhenLazy(executionStack, v, function(v) {
                        stack.unshift(v);
                        that.executeNextCode(executionStack,code,env,stack);
                    });
                    return;
                case "LAZY":
                    stack.unshift({LAZY_ENV:[current.LAZY, env.slice()]});
                    break;
                default:
                    throw new Error("Runtime error while executing instruction " + JSON.stringify(current));
            }
            
            executionStack.unshift(function(executionStack) {
                return that.executeNextCode(executionStack, code, env, stack);
            });            
            
            return;
        }
        
        if (this.debug) {
            executionTrace(code, env, stack);
        }
    };

    Runtime.prototype.executeCodeStack = function(executionStack) {
        while(executionStack.length > 0) {
            var nextOperation = executionStack.shift();
            nextOperation(executionStack);
        }
    };
    

    Runtime.prototype.executeCode = function(toExecute, initialEnv) {        
        var that = this,
            stack = [];
        
        this.executeCodeStack([function(executionStack) { 
            return that.executeNextCode(executionStack,toExecute,initialEnv,stack); 
        }]);
            
        return stack.shift();
    };
    
    Runtime.prototype.execute = function(toExecute) {
        return this.executeCode(toExecute,[]);
    };

    return new Runtime();    
}());
