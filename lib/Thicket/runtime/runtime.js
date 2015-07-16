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
        return Object.keys(struct)[0];
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

                        // TODO -- Remove this ugly code 
                        
                        if (render && name === "Data.Unit.unit") {
                            return "()";
                        }

                        if (render && ["Data.Number.number","Data.String.string"].indexOf(name) !== -1) {
                            return pretty(render)(code[1]);
                        }

                        return "<" + type.toLowerCase() + " " + name + ">";
                    case 'NATIVE':
                        return "<NATIVE '" + code.NATIVE[0] + "'>";
                    case 'CACHED':
                        if (code.CACHED[2]) {
                            return "<CACHED " + pretty(render)(code.CACHED[2]) + ">";
                        }
                        
                        return "<CACHED ...>";
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
        var entry = null,
                className = value.CLASS[0],
                methods = value.CLASS[1],
                entries = value.CLASS[2],
                modelName = getModelName(model);

        // Second specific method for named models
        if (modelName && entries.indexOf(modelName + "." + name) > -1) {
            entry = methods[entries.indexOf(modelName + "." + name)];
        } 

        // Third general method
        if (!entry && entries.indexOf(name) > -1) {
            entry = methods[entries.indexOf(name)];
        }

        // Last system definition
        if (!entry) {
            entry = this.delta[className + "." + name];
        }

        if (!entry) {
            throw new Error("Method " + name + " not found in " + className);
        }

        return entry;
    };

        
    Runtime.prototype.lookupAttribute = function(value, name) {
        var entry = null,
            modelName = value.MODEL[0],
            methods = value.MODEL[1],
            entries = value.MODEL[2];

        if (entries.indexOf(name) > -1) { 
            entry = methods[entries.indexOf(name)];
        }

        if (!entry) {
             throw new Error("Attribute " + name + " not found in " + modelName);
         }

        return entry;
    };   

    Runtime.prototype.alterAttribute = function(value, name, alteration) {
        switch (getInstruction(value.OBJ[0])) {
            case "MODEL":
                var values,
                    entries = value.OBJ[0].MODEL[2],
                    indice = entries.indexOf(name);
                
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
    
    Runtime.prototype.register = function(current, namespace) {
        function fullyQualifiedName(name) {
            if (namespace) {
                return namespace + "." + name;
            } 
            
            return name;
        }
        
        switch(getInstruction(current)) {
            case "MODEL":
                current.MODEL[2] = current.MODEL[1].map(function(e) { return e[0]; });
                current.MODEL[1] = current.MODEL[1].map(function(e) { return e[1]; });
                this.define(fullyQualifiedName(current.MODEL[0]), close(current.MODEL[1].length, [current]));
                break;
            case "CLASS":
                current.CLASS[2] = current.CLASS[1].map(function(e) { return e[0]; });
                current.CLASS[1] = current.CLASS[1].map(function(e) { return e[1]; });
                this.define(fullyQualifiedName(current.CLASS[0]), close(1, [current]));
                break;
            case "DEFINITION":
                this.define(fullyQualifiedName(current.DEFINITION[0]), [current]);
                break;
        }
    };
      
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
    
    var MEASURE = {};
    
    Runtime.prototype.executeWhenLazy = function (executionStack, code, continuation) {
        var that = this, 
            stack = [];

        if (!code.CACHED) {
            continuation(code);
        } else if (code.CACHED[2]) {
            continuation(code.CACHED[2]);
        } else {
            executionStack.unshift(function() {
                code.CACHED[2] = stack.shift();
                continuation(code.CACHED[2]);
            });
            executionStack.unshift(function(executionStack) {
                that.executeNextCode(executionStack,
                                     code.CACHED[0].slice(), 
                                     code.CACHED[1].slice(),
                                     stack); 
            });
        }
    };        
    
    Runtime.prototype.executeNextCode = function(executionStack,code,env,stack) {
        var that = this;
        
        while (code.length === 0) {
            return; // No more code to be executed
        }
            
        var current = code.shift(), 
            instruction = getInstruction(current),
            n, v, c, e, p;

        var t0 = Date.now();

        switch(instruction) {
            case "RESULT": // For native result !?
                stack.unshift(current.RESULT);
                executionStack.unshift(function(executionStack) {
                    return that.executeNextCode(executionStack, code, env, stack);
                });                        
                break;
            case "NATIVE":
                p = [];

                executionStack.unshift(function(executionStack) {
                    code = that.external[current.NATIVE[0]](p).concat([{RETURN:1}]).concat(code);
                    that.executeNextCode(executionStack,code,env,stack); 
                });

                env.slice(0,current.NATIVE[1]).forEach(function (param) {
                    executionStack.unshift(function(executionStack) {
                        return that.executeWhenLazy(executionStack, param, function(result) {
                            p.unshift(result);
                        });
                    });                          
                });
                break;
            case "MODEL":                      
                p = [];

                executionStack.unshift(function(executionStack) {
                    stack.unshift({OBJ:[current, p]});
                    that.executeNextCode(executionStack,code,env,stack); 
                });

                env.slice(0,current.MODEL[1].length).forEach(function (param) {
                    executionStack.unshift(function(executionStack) {
                        return that.executeWhenLazy(executionStack, param, function(result) {
                            p.unshift(result);
                        });
                    });                          
                });
                break;                    
            case "CLASS":
                that.executeWhenLazy(executionStack, env[0], function(result) {
                    stack.unshift({OBJ:[current, result]});
                    that.executeNextCode(executionStack,code,env,stack);
                });
                break;
            case "DEFINITION":
                stack.unshift(env);
                stack.unshift(code);                                 
                code = current.DEFINITION[1].concat([{RETURN:1}]);
                env = [];
                executionStack.unshift(function(executionStack) {
                    return that.executeNextCode(executionStack, code, env, stack);
                });                        
                break;
            case "CONST":
                stack.unshift(current);
                executionStack.unshift(function(executionStack) {
                    return that.executeNextCode(executionStack, code, env, stack);
                });                        
                break;
            case "IDENT":
                code = this.idents[current.IDENT].concat(code);
                executionStack.unshift(function(executionStack) {
                    return that.executeNextCode(executionStack, code, env, stack);
                });                        
                break;
            case "ACCESS":
                stack.unshift(env[env.length-current.ACCESS]);
                executionStack.unshift(function(executionStack) {
                    return that.executeNextCode(executionStack, code, env, stack);
                });                        
                break;
            case "CLOSURE":
                stack.unshift({ENV:[current.CLOSURE, env.slice()]});
                executionStack.unshift(function(executionStack) {
                    return that.executeNextCode(executionStack, code, env, stack);
                });                        
                break;
            case "ALTER":
                n = current.ALTER;
                v = stack.shift();
                that.executeWhenLazy(executionStack, stack.shift(), function(m) {
                    stack.unshift(that.alterAttribute(m,n,v));
                    that.executeNextCode(executionStack,code,env,stack);
                });
                break;                    
            case "INVOKE":
            case "TAILINVOKE":
                v = current[instruction];
                c = stack.shift();
                if (instruction === 'INVOKE') {
                    stack.unshift(env);
                    stack.unshift(code);
                }
                that.executeWhenLazy(executionStack, c, function(c) {
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
                break;
            case "APPLY":
            case "TAILAPPLY":
                v = stack.shift();
                c = stack.shift();
                if (instruction === 'APPLY') {
                    stack.unshift(env);
                    stack.unshift(code);
                }
                that.executeWhenLazy(executionStack, c, function(c) {                        
                    code = c.ENV[0].slice();
                    env = c.ENV[1].slice();
                    env.unshift(v);
                    that.executeNextCode(executionStack,code,env,stack);
                });
                break;
            case "RETURN":
                v = stack.shift();
                c = stack.shift();
                e = stack.shift();
                code = c.slice();
                env = e.slice();
                that.executeWhenLazy(executionStack, v, function(v) {
                    stack.unshift(v);
                    that.executeNextCode(executionStack,code,env,stack);
                });
                break;
            case "PUSH":
                stack.unshift({CACHED:[current.PUSH, env.slice()]});
                executionStack.unshift(function(executionStack) {
                    return that.executeNextCode(executionStack, code, env, stack);
                });                        
                break;
            default:
                throw new Error("Runtime error while executing instruction " + JSON.stringify(current));
        }

        if (this.debug) {
            if (!MEASURE.hasOwnProperty(instruction)) {
                MEASURE[instruction] = { duration: 0, hits: 0 };
            }
            MEASURE[instruction].duration = MEASURE[instruction].duration + (Date.now() - t0);
            MEASURE[instruction].hits     = MEASURE[instruction].hits + 1;
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
        var t0 = Date.now();
        MEASURE = {};
        try {
            return this.executeCode(toExecute,[]);
        } finally {
            if (this.debug) {
                var total = Date.now() - t0,
                    hits = 0,
                    k;
                
                for (k in MEASURE) {
                    hits += MEASURE[k].hits;
                }
                
                for (k in MEASURE) {
                    console.log("Takes " + 
                                MEASURE[k].duration + " ms (" + Math.floor(100*MEASURE[k].duration/total) +"%)\t | " +
                                MEASURE[k].hits     + " hits (" + Math.floor(100*MEASURE[k].hits/hits) +"%)\t | " +
                                Math.floor(10000*(MEASURE[k].duration/(1+MEASURE[k].hits))) + "w\t | " + 
                                
                                k);
                }
            }
        }
    };

    return new Runtime();    
}());
