/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    "use strict";
    
    var $i = require('./instruction.js');
    
    // ------------------------------------------------------------------------------------------------
    // Private bahaviors
    // ------------------------------------------------------------------------------------------------
    
    function isClassInstance(value) {
        switch (getInstruction(value)) {
            case $i.CLASS:
                return true;
        }
        
        // Fallback
        
        return false;
    }
    
    function getModelName(struct) {
        if (struct[0] === $i.OBJ) {
            return getModelName(struct[1][0]);
        }
        
        return struct[1][0];
    }
    
    function getInstruction(struct) {
        try {
            return struct[0];
        } catch (e) {
            return null;
        }
    }
    
    function close(i, t) {
        if (i <= 0) {
            return t;
        }
        
        return [[ $i.CLOSURE , close(i-1, t).concat([[ $i.RETURN ]]) ]];
    }
    
    function pretty(code ) {
        var type, name;

        if (code[0] instanceof Array) {
            type = getInstruction(code[0]);

            switch (type) {
                case $i.OBJ:
                    return pretty(code[1]);
                case $i.MODEL:
                case $i.CLASS:
                    name = code[0][1][0];

                    if (["number","string"].indexOf(name) !== -1) {
                        return pretty(code[1]);
                    }
                    
                    var strType = type === 8 ? "model" : "class";

                    return "<" + strType + " " + name + ">";
            }

            return "[" + code.map(pretty).join(",") + "]";
        } else {        
            type = getInstruction(code);

            switch (type) {
                case $i.CONST:
                    if (typeof code[1] === 'number') {
                        return code[1];
                    }
                    return JSON.stringify(code[1]);
                case $i.MODEL:
                case $i.CLASS:
                    name = code[1][0];

                    if (name === "unit") {
                        return "()";
                    }

                    if (["number","string"].indexOf(name) !== -1) {
                        return pretty(code[1]);
                    }

                    return "<" + type.toLowerCase() + " " + name + ">";
                case $i.NATIVE:
                    return "<$i.NATIVE '" + code[1][0] + "'>";
                case $i.CACHED:
                    if (code[1][2]) {
                        return "<CACHED " + pretty(code[1][2]) + ">";
                    }

                    return "<CACHED " + pretty(code[1]) + ">";
                default:
                    if ($i.OBJ === type) {
                        return pretty(code[1]);
                    }

                    if ([$i.CLOSURE,$i.ENV].indexOf(type) !== -1) {
                        return "<function>";                        
                    }
                    
                    if (type) {
                        return "<" + type + " " + pretty(code[1]) + ">";
                    } else {
                        return JSON.stringify(code);
                    }
            }
        }
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
    
    function getNamespace(n) {
        var names = n.split(".");
        names.pop();
        return names.join(".");
    }

    // ------------------------------------------------------------------------------------------------
    // constructor
    // ------------------------------------------------------------------------------------------------
    
    function Runtime(reader) {
        this.reader = reader;
        this.debug = false;
        this.idents = {};
        this.external = {};
        this.delta = {};
    }
        
    // ------------------------------------------------------------------------------------------------
    // Public behaviors
    // ------------------------------------------------------------------------------------------------
        
    Runtime.prototype.loadModule = function(name) {
        var that = this;
        
        console.log("Loading module " + name);
        
        this.reader.map(function (reader) {
            var code = reader.code(name);

            code.objcode.map(function(entity) {
                that.register(entity, code.namespace);
            });
        });
    };

    Runtime.prototype.instruction = $i;
    
    Runtime.prototype.getIdent = function(name) {
        if (!this.idents.hasOwnProperty(name)) {
            this.loadModule(getNamespace(name));
        } 

        if (this.idents.hasOwnProperty(name)) {
            return this.idents[name];
        } 
        
        throw new Error("No definition available for " + name);
    };
    
    Runtime.prototype.setIdent = function(name, value) {
        this.idents[name] = value;
    };
    
    Runtime.prototype.getType = getType;
    
    Runtime.prototype.setDebug = function(debug) {
        this.debug = debug;
        return this;
    };

    Runtime.prototype.pretty = pretty;
    
    Runtime.prototype.extendWith = function (extension) {
        extension(this);        
        return this;
    };
    
    Runtime.prototype.lookupMethod = function(value, model, name) {
        var entry = null,
            methods = value[1][1],
            entries = value[1][2],
            derivations = value[1][3],
            modelName = getModelName(model),
            index;
        
        // specific method for named models        
        index = entries.indexOf(modelName + "." + name);
        if (index > -1) {
            return methods[index];
        } 

        // general method
        index = entries.indexOf(name);        
        if (index > -1) {
            return methods[index];
        }

        for(var i = 0; entry === null && i < derivations.length; i++) {            
            var derivation = this.getIdent(derivations[i]);
            // TODO -- review this code 
            if (derivation[0][1] && isClassInstance(derivation[0][1][0])) {
                entry = this.lookupMethod(derivation[0][1][0], model, name);
            }
        }
        
        return entry;
    };

    Runtime.prototype.lookupMethodOrInternal = function(value, model, name) {
        var entry = this.lookupMethod(value, model, name),
            className = value[1][0];

        // system definition
        if (!entry) {
            entry = this.delta[className + "." + name];
        }

        if (!entry) {
            throw new Error("Method " + name + " not found in " + className);
        }

        return entry;
    };

    Runtime.prototype.lookupAttribute = function(value, name) {
        var modelName = value[1][0],
            methods = value[1][1],
            entries = value[1][2],
            index = entries.indexOf(name);

        if (index > -1) { 
            return methods[index];
        }

        throw new Error("Attribute " + name + " not found in " + modelName);
    };   

    Runtime.prototype.alterAttribute = function(value, name, alteration) {
        this.pretty(alteration);
        switch (getInstruction(value[1][0])) {
            case $i.MODEL:
                var values,
                    entries = value[1][0][1][2],
                    indice = entries.indexOf(name);
                
                values = value[1][1].map(function(v,index) {
                    if (indice === (value[1][1].length - 1 - index)) {
                        return alteration;
                    } else {
                        return v;
                    }
                });
                
                return [ $i.OBJ, [value[1][0], values] ];
        }
        
        throw new Error("Definition " + name + " not found in " + getInstruction(value));
    };

    Runtime.prototype.native0 = function(name, arity, value) {
        this.delta[name] = [[ $i.NATIVE, [name,arity] ]];
        this.external[name] = value;
    };
    
    Runtime.prototype.native = function(name, arity, value) {
        // self closure implicit evaluation
        if (this.delta.hasOwnProperty(name)) {
            throw new Error("Native method " + name + " aleady exist");
        }
        
        this.delta[name] = close(arity,[[ $i.NATIVE, [name,arity] ]]);
        this.external[name] = value;
    };
    
    Runtime.prototype.define = function(name, value) {
        this.setIdent(name, value);
    };
    
    Runtime.prototype.register = function(current, namespace) {
        function fullyQualifiedName(name) {
            if (namespace) {
                return namespace + "." + name;
            }             
            return name;
        }
        
        switch(getInstruction(current)) {
            case $i.MODEL:        
                current[1][2] = current[1][1].map(function(e) { return e[0]; });
                current[1][1] = current[1][1].map(function(e) { return e[1]; });
                this.define(fullyQualifiedName(current[1][0]), close(current[1][1].length, [current]));
                break;
            case $i.CLASS:
                current[1][3] = current[1][2];
                current[1][2] = current[1][1].map(function(e) { return e[0]; });
                current[1][1] = current[1][1].map(function(e) { return e[1]; });
                this.define(fullyQualifiedName(current[1][0]), close(1, [current]));
                break;
            case $i.DEFINITION:
                this.define(fullyQualifiedName(current[1][0]), [current]);
                break;
        }
    };
      
    Runtime.prototype.constant = function(value) {
        if (value[0] === $i.CONST) {
            return value[1];
        } else if (value[0] === $i.OBJ) {        
            return this.constant(value[1][1]);
        }

        throw new Error("Value " + this.pretty(value) + " has no constant");
    };

    var MEASURE = {};
    
    Runtime.prototype.hasBeenEvaluated = function(code) {
        if (code[0] !== $i.CACHED) {
            return code;
        } else if (code[1][2]) {
            return code[1][2];
        } else {
            return null;
        }
    };
    
    Runtime.prototype.executeNextCode = function(initialCode, initialEnv) {
        var code = initialCode,
            env = initialEnv,
            stack = [],
            current, 
            instruction,
            n, m, v, c, e, p, r,
            t0;
        
        if (this.debug) {
            t0 = Date.now();
        }
        
        while (code.length !== 0) {    
            current = code.shift();
            instruction = getInstruction(current);
            
            switch(instruction) {
                case $i.NATIVE:
                case $i.CLASS:
                case $i.MODEL:                      
                  if (instruction === $i.NATIVE) {
                        m = current[1][1];
                        stack.unshift([[ $i.R_NATIVE, current[1] ]].concat(code), env);        
                    } else if (instruction === $i.MODEL) {
                        m = current[1][1].length;
                        stack.unshift([[ $i.R_MODEL, [current, m] ]].concat(code), env);
                    } else {
                        m = 1;
                        stack.unshift([[ $i.R_CLASS,current ]].concat(code), env);
                    }
                    
                    for(n = 0; n < m; n++) {
                        v = env[n];
                        r = this.hasBeenEvaluated(v);                            
                        if (r) {
                            stack.unshift([[ $i.RESULT, r ],[ $i.R_RETURN, m-n ]], []);
                        } else {
                            stack.unshift(v[1][0].concat([[ $i.R_CACHED, v[1] ], [ $i.R_RETURN, m-n ]]), v[1][1].slice());
                        }
                    }    
                    code = stack.shift();
                    env = stack.shift();
                    break;
                case $i.DEFINITION:
                    stack.unshift(code, env);                    
                    code = current[1][1].concat([[ $i.RETURN ]]);
                    env = [];                    
                    break;
                case $i.CONST:
                    stack.unshift(current);                    
                    break;
                case $i.IDENT:
                    code = this.getIdent(current[1]).concat(code);                    
                    break;
                case $i.ACCESS:
                    stack.unshift(env[env.length-current[1]]);                    
                    break;
                case $i.CLOSURE:
                    stack.unshift([ $i.ENV, [current[1], env.slice()] ]);                    
                    break;
                case $i.ALTER:
                    n = current[1];
                    v = stack.shift();
                    
                    r = this.hasBeenEvaluated(v);                                    
                    if (r) {
                        stack.unshift(r);
                        code = [[ $i.R_ALTER, n ]].concat(code);
                    } else {
                        stack.unshift([[ $i.R_ALTER, n ]].concat(code), env);
                        env = v[1][1].slice();
                        code = v[1][0].concat([[ $i.R_CACHED, v[1] ],[ $i.R_RETURN, 1 ]]);
                    }                                        
                    break;                    
                case $i.INVOKE:
                case $i.TAILINVOKE:
                    v = current[1];
                    c = stack.shift();  
                    
                    if (instruction === $i.INVOKE) {
                        stack.unshift(code, env);
                    }                        

                    r = this.hasBeenEvaluated(c);                        
                    if (r) {                        
                        stack.unshift(r);
                        code = [[ $i.R_ANYINVOKE, v ]].concat(code);
                    } else {
                        stack.unshift([[ $i.R_ANYINVOKE, v ]].concat(code), env);
                        env = c[1][1].slice();
                        code = c[1][0].concat([[ $i.R_CACHED, c[1] ], [ $i.R_RETURN, 1 ]]);
                    }                    
                    break;                          
                case $i.APPLY:
                case $i.TAILAPPLY:
                    v = stack.shift();
                    c = stack.shift();  
                    
                    if (instruction === $i.APPLY) {
                        stack.unshift(code, env);
                    }
                    
                    r = this.hasBeenEvaluated(c);
                    
                    if (r) {                        
                        stack.unshift(r);
                        code = [[ $i.R_ANYAPPLY, v ]].concat(code);
                    } else {
                        stack.unshift([[ $i.R_ANYAPPLY, v ]].concat(code), env);
                        env = c[1][1].slice();
                        code = c[1][0].concat([[ $i.R_CACHED, c[1] ], [ $i.R_RETURN, 1 ]]);
                    }                    
                    break;                          
                case $i.RETURN:
                    v = stack.shift();
                    c = stack.shift();
                    e = stack.shift();
                    
                    env = e.slice();
                    code = c.slice();
                    
                    r = this.hasBeenEvaluated(v);
                    if (r) {                        
                        stack.unshift(r);
                    } else {
                        stack.unshift(code, env);                
                        env = v[1][1].slice();   
                        code = v[1][0].concat([[ $i.R_CACHED, v[1] ], [ $i.R_RETURN, 1 ]]);
                    }
                    break;                        
                case $i.PUSH:
                    stack.unshift([ $i.CACHED, [current[1], env.slice()] ]);
                    break;
                case $i.CACHED:
                    c = current;
                    r = this.hasBeenEvaluated(c);                        
                    if (r) {                        
                        stack.unshift(r);
                    } else {
                        stack.unshift(code, env);
                        env = c[1][1].slice();
                        code = c[1][0].concat([[ $i.R_CACHED, c[1] ], [ $i.R_RETURN, 1 ]]);
                    }
                    break;
                    
                // -----------------------------------------------------------------
                // SPECIFIC CODE FOR CACHED CODE AND DEFERRED CONSTRUCTION
                // Objcode only generated during runtime process i.e. Not GENERATED
                // -----------------------------------------------------------------
                    
                case $i.RESULT:
                    stack.unshift(current[1]);
                    break;
                case $i.R_ALTER:
                    v = stack.shift();
                    c = stack.shift();
                    stack.unshift(this.alterAttribute(c,current[1],v));
                    break;
                case $i.R_CACHED:
                    current[1][2] = stack[0];
                    break;
                case $i.R_MODEL:
                    p = stack.splice(0,current[1][1]);
                    stack.unshift([ $i.OBJ, [current[1][0],p] ]);  
                    break;     
                case $i.R_CLASS:
                    p = stack.shift();
                    stack.unshift([ $i.OBJ, [current[1],p] ]);  
                    break;     
                case $i.R_NATIVE:
                    p = stack.splice(0,current[1][1]);
                    code = this.external[current[1][0]](p).concat([[ $i.RETURN ]]).concat(code);
                    break;    
                case $i.R_ANYAPPLY:
                    c = stack.shift();
                    env = c[1][1].slice();
                    code = c[1][0].slice();
                    env.unshift(current[1]);                 
                    break;
                case $i.R_ANYINVOKE:
                    v = current[1];
                    c = stack.shift();                        
                    if (isClassInstance(c[1][0])) {
                        code = this.lookupMethodOrInternal(c[1][0], c[1][1], v).concat([[ $i.RETURN ]]);
                        env = [];
                        env.unshift([ $i.OBJ, [c[1][0], c[1][1]] ], c[1][1]);
                    } else {
                        code = this.lookupAttribute(c[1][0], v).concat([[ $i.RETURN ]]);
                        env = c[1][1].slice();
                    }
                    break;
                case $i.R_RETURN:
                    c = stack.splice(current[1],2);
                    code = c[0];
                    env = c[1];
                    break;
                default:
                    throw new Error("Runtime error while executing instruction " + JSON.stringify(current));
            }

            if (this.debug) {
                if (!MEASURE.hasOwnProperty(instruction)) {
                    MEASURE[instruction] = { duration: 0, hits: 0 };
                }
                
                MEASURE[instruction].duration = MEASURE[instruction].duration + (Date.now() - t0);
                MEASURE[instruction].hits = MEASURE[instruction].hits + 1;
                
                t0 = Date.now();
            }
        }
        
        return stack;
    };
    
    Runtime.prototype.executeCode = function(toExecute, initialEnv) {        
        return this.executeNextCode(toExecute,initialEnv).shift();
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
                                Math.floor(10000*(MEASURE[k].duration/(1+MEASURE[k].hits))) + "w\t | " + k);
                }
                
                console.log("Total time " + total + " ms\t | " + 
                            hits + " hits \t | " + 
                            Math.floor(10000*(total/(1+hits))) + "w");
            }
        }
    };

    return function(reader) {
        return new Runtime(reader);    
    };
}());
