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
            case $i.code.CLASS:
                return true;
        }
        
        // Fallback
        
        return false;
    }
    
    function getModelName(struct) {
        if (struct[0] === $i.code.OBJ) {
            return getModelName(struct[1][0]);
        }
        
        return struct[1][0];
    }
    
    function getInstruction(struct) {
        return struct[0];
    }
    
    function close(i, t) {
        if (i <= 0) {
            return t;
        }
        
        return [[ $i.code.CLOSURE , close(i-1, t).concat([[ $i.code.RETURN ]]) ]];
    }
    
    function pretty(code ) {
        var type, name;

        if (code[0] instanceof Array) {
            type = getInstruction(code[0]);

            switch (type) {
                case $i.code.OBJ:
                    return pretty(code[1]);
                case $i.code.MODEL:
                case $i.code.CLASS:
                    name = code[0][1][0];

                    if (["number","string","char"].indexOf(name) !== -1) {
                        return pretty(code[1]);
                    }
                    
                    var strType = type === 8 ? "model" : "class";

                    return "<" + strType + " " + name + ">";
            }

            return "[" + code.map(pretty).join(",") + "]";
        } else {        
            type = getInstruction(code);

            switch (type) {
                case $i.code.CONST:
                    if (typeof code[1] === 'number') {
                        return code[1];
                    }
                    if (typeof code[1] === 'char') {
                        return "'" + code[1] + "'";
                    }
                    if (typeof code[1] === 'string') {
                        return '"' + code[1] + '"';
                    }
                    return JSON.stringify(code[1]);
                case $i.code.MODEL:
                case $i.code.CLASS:
                    name = code[1][0];

                    if (name === "unit") {
                        return "()";
                    }

                    if (typeof name === 'number') {
                        return code[1][1];
                    }
                    if (typeof name === 'char') {
                        return "'" + code[1][1] + "'";
                    }
                    if (typeof name === 'string') {
                        return '"' + code[1][1] + '"';
                    }

                    return "<" + type.toLowerCase() + " " + name + ">";
                case $i.code.NATIVE:
                    return "<$i.code.NATIVE '" + code[1][0] + "'>";
                case $i.code.CACHED:
                    if (code[1][2]) {
                        return "<CACHED " + pretty(code[1][2]) + ">";
                    }

                    return "<CACHED " + pretty(code[1]) + ">";
                default:
                    if ($i.code.OBJ === type) {
                        return pretty(code[1]);
                    }

                    if ([$i.code.CLOSURE,$i.code.ENV].indexOf(type) !== -1) {
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
    
    // ------------------------------------------------------------------------------------------------
    // constructor
    // ------------------------------------------------------------------------------------------------
    
    function Runtime(reader) {
        this.reader = reader;
        this.debug = false;
        this.idents = {};
        this.external = {};
        this.delta = {};
        
        this.init();        
    }
    
    Runtime.prototype.init = function() {
        // ------------------------------
        // Public delta rule in internal
        // ------------------------------        
        var that = this;
        
        this.native0("internalClass.apply", 2, function(env) {
            var name = that.constant(env.pop()); // THIS
            env.pop();                           // SELF

            if (that.delta.hasOwnProperty(name)) {
                return that.delta[name];
            } else {
                throw new Error("no system definition for " + JSON.stringify(name));
            }
        });
    };
        
    // ------------------------------------------------------------------------------------------------
    // Public behaviors
    // ------------------------------------------------------------------------------------------------
        
    //
    // Module and package management
    //
    
    Runtime.prototype.storeModule = function(code) {
        var that = this;
        
        code.objcode.map(function(entity) {
            that.register(entity, code.namespace);
        });

        return code.main;
    };
        
    Runtime.prototype.loadModule = function(name) {
        var that = this;
        
        return this.reader.map(function (reader) {
            return that.storeModule(reader.code(name));
        });
    };
        
    Runtime.prototype.storePackage = function(aPackage) {
        return this.reader.map(function (reader) {
            reader.addPackage(aPackage);
        });
    };
        
    Runtime.prototype.loadPackage = function(name) {
        return this.reader.map(function (reader) {
            reader.addPackage(reader.package(name));
        });
    };
    
    Runtime.prototype.storeAndExecuteModule = function(content) {
        var that = this;
        
        this.storeModule(content).map(function (main) {
            main.map(function(main) {
                that.execute(main);
            });
        });
    };
    
    Runtime.prototype.loadAndExecuteModule = function(name) {
        var that = this;
        
        this.loadModule(name).map(function (main) {
            main.map(function(main) {
                that.execute(main);
            });
        });
    };

    //
    // Instruction management
    // 
    
    Runtime.prototype.instruction = $i.code;
    
    Runtime.prototype.getIdent = function(name) {
        function getNamespace(n) {
            var names = n.split(".");
            names.pop();
            return names.join(".");
        }        
        
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

    Runtime.prototype.getDebug = function() {
        return this.debug;
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
            case $i.code.MODEL:
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
                
                return [ $i.code.OBJ, [value[1][0], values] ];
        }
        
        throw new Error("Definition " + name + " not found in " + getInstruction(value));
    };

    Runtime.prototype.native0 = function(name, arity, value) {
        this.delta[name] = [[ $i.code.NATIVE, [name,arity] ]];
        this.external[name] = value;
    };
    
    Runtime.prototype.native = function(name, arity, value) {
        // self closure implicit evaluation
        if (this.delta.hasOwnProperty(name)) {
            throw new Error("Native method " + name + " aleady exist");
        }
        
        this.delta[name] = close(arity,[[ $i.code.NATIVE, [name,arity] ]]);
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
            case $i.code.MODEL:        
                current[1][2] = current[1][1].map(function(e) { return e[0]; });
                current[1][1] = current[1][1].map(function(e) { return e[1]; });
                this.define(fullyQualifiedName(current[1][0]), close(current[1][1].length, [current]));
                break;
            case $i.code.CLASS:
                current[1][3] = current[1][2];
                current[1][2] = current[1][1].map(function(e) { return e[0]; });
                current[1][1] = current[1][1].map(function(e) { return e[1]; });
                this.define(fullyQualifiedName(current[1][0]), close(1, [current]));
                break;
            case $i.code.DEFINITION:
                this.define(fullyQualifiedName(current[1][0]), [current]);
                break;
        }
    };
      
    Runtime.prototype.constant = function(value) {
        if (value[0] === $i.code.CONST) {
            return value[1];
        } else if (value[0] === $i.code.OBJ) {        
            return this.constant(value[1][1]);
        }

        throw new Error("Value " + this.pretty(value) + " has no constant");
    };

    Runtime.prototype.hasBeenEvaluated = function(code) {
        if (code[0] !== $i.code.CACHED) {
            return code;
        } else if (code[1][2]) {
            return code[1][2];
        } else {
            return null;
        }
    };
    
    Runtime.prototype.executeNextCode = function(initialCode, initialEnv, measures) {
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
                /* do we manage a model as a lazy structure ?
                case $i.code.MODEL:  
                    stack.unshift([$i.code.OBJ,[ current, env.slice(0,current[1][1].length) ]]);
                    break;                           
                */                    
                case $i.code.NATIVE:
                case $i.code.CLASS:
                case $i.code.MODEL:                      
                    if (instruction === $i.code.NATIVE) {
                        m = current[1][1];
                        stack.unshift([[ $i.code.R_NATIVE, current[1] ]].concat(code), env);        
                    } else if (instruction === $i.code.MODEL) {
                        m = current[1][1].length;
                        stack.unshift([[ $i.code.R_MODEL, [current, m] ]].concat(code), env);
                    } else {
                        m = 1;
                        stack.unshift([[ $i.code.R_CLASS,current ]].concat(code), env);
                    }
                    
                    for(n = 0; n < m; n++) {
                        v = env[n];
                        r = this.hasBeenEvaluated(v);                            
                        if (r) {
                            stack.unshift([[ $i.code.RESULT, r ],[ $i.code.R_RETURN, m-n ]], []);
                        } else {
                            stack.unshift(v[1][0].concat([[ $i.code.R_CACHED, v[1] ], [ $i.code.R_RETURN, m-n ]]), v[1][1].slice());
                        }
                    }    
                    code = stack.shift();
                    env = stack.shift();
                    break;
                case $i.code.DEFINITION:
                    stack.unshift(code, env);                    
                    code = current[1][1].concat([[ $i.code.RETURN ]]);
                    env = [];                    
                    break;
                case $i.code.CONST:
                    stack.unshift(current);                    
                    break;
                case $i.code.IDENT:
                    code = this.getIdent(current[1]).concat(code);                    
                    break;
                case $i.code.ACCESS:
                    stack.unshift(env[env.length-current[1]]);                    
                    break;
                case $i.code.CLOSURE:
                    stack.unshift([ $i.code.ENV, [current[1], env.slice()] ]);                    
                    break;
                case $i.code.ALTER:
                    n = current[1];
                    v = stack.shift();
                    
                    r = this.hasBeenEvaluated(v);                                    
                    if (r) {
                        stack.unshift(r);
                        code = [[ $i.code.R_ALTER, n ]].concat(code);
                    } else {
                        stack.unshift([[ $i.code.R_ALTER, n ]].concat(code), env);
                        env = v[1][1].slice();
                        code = v[1][0].concat([[ $i.code.R_CACHED, v[1] ],[ $i.code.R_RETURN, 1 ]]);
                    }                                        
                    break;                    
                case $i.code.INVOKE:
                case $i.code.TAILINVOKE:
                    v = current[1];
                    c = stack.shift();  
                    
                    if (instruction === $i.code.INVOKE) {
                        stack.unshift(code, env);
                    }                        

                    r = this.hasBeenEvaluated(c);                        
                    if (r) {                        
                        stack.unshift(r);
                        code = [[ $i.code.R_ANYINVOKE, v ]];
                    } else {
                        stack.unshift([[ $i.code.R_ANYINVOKE, v ]], env);
                        env = c[1][1].slice();
                        code = c[1][0].concat([[ $i.code.R_CACHED, c[1] ], [ $i.code.R_RETURN, 1 ]]);
                    }                    
                    break;                          
                case $i.code.APPLY:
                case $i.code.TAILAPPLY:
                    v = stack.shift();
                    c = stack.shift();  
                    
                    if (instruction === $i.code.APPLY) {
                        stack.unshift(code, env);
                    }
                    
                    r = this.hasBeenEvaluated(c);
                    
                    if (r) {                        
                        stack.unshift(r);
                        code = [[ $i.code.R_ANYAPPLY, v ]];
                    } else {
                        stack.unshift([[ $i.code.R_ANYAPPLY, v ]], env);
                        env = c[1][1].slice();
                        code = c[1][0].concat([[ $i.code.R_CACHED, c[1] ], [ $i.code.R_RETURN, 1 ]]);
                    }                    
                    break;                          
                case $i.code.RETURN:
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
                        code = v[1][0].concat([[ $i.code.R_CACHED, v[1] ], [ $i.code.R_RETURN, 1 ]]);
                    }
                    break;                        
                case $i.code.PUSH:
                    stack.unshift([ $i.code.CACHED, [current[1], env.slice()] ]);
                    break;
                case $i.code.CACHED:
                    c = current;
                    r = this.hasBeenEvaluated(c);                        
                    if (r) {                        
                        stack.unshift(r);
                    } else {
                        stack.unshift(code, env);
                        env = c[1][1].slice();
                        code = c[1][0].concat([[ $i.code.R_CACHED, c[1] ], [ $i.code.R_RETURN, 1 ]]);
                    }
                    break;
                    
                // -----------------------------------------------------------------
                // SPECIFIC CODE FOR CACHED CODE AND DEFERRED CONSTRUCTION
                // Objcode only generated during runtime process i.e. Not GENERATED
                // -----------------------------------------------------------------
                    
                case $i.code.RESULT:
                    stack.unshift(current[1]);
                    break;
                case $i.code.R_ALTER:
                    v = stack.shift();
                    c = stack.shift();
                    stack.unshift(this.alterAttribute(c,current[1],v));
                    break;
                case $i.code.R_CACHED:
                    current[1][2] = stack[0];
                    break;
                case $i.code.R_MODEL:
                    p = stack.splice(0,current[1][1]);
                    stack.unshift([ $i.code.OBJ, [current[1][0],p] ]);  
                    break;     
                case $i.code.R_CLASS:
                    p = stack.shift();
                    stack.unshift([ $i.code.OBJ, [current[1],p] ]);  
                    break;     
                case $i.code.R_NATIVE:
                    p = stack.splice(0,current[1][1]);
                    code = this.external[current[1][0]](p, measures).concat([[ $i.code.RETURN ]]).concat(code);
                    t0 = Date.now();
                    break;    
                case $i.code.R_ANYAPPLY:
                    c = stack.shift();
                    env = c[1][1].slice();
                    code = c[1][0].slice();
                    env.unshift(current[1]);                 
                    break;
                case $i.code.R_ANYINVOKE:
                    v = current[1];
                    c = stack.shift();                        
                    if (isClassInstance(c[1][0])) {
                        code = this.lookupMethodOrInternal(c[1][0], c[1][1], v).concat([[ $i.code.RETURN ]]);
                        env = [];
                        env.unshift([ $i.code.OBJ, [c[1][0], c[1][1]] ], c[1][1]);
                    } else {
                        code = this.lookupAttribute(c[1][0], v).concat([[ $i.code.RETURN ]]);
                        env = c[1][1].slice();
                    }
                    break;
                case $i.code.R_RETURN:
                    c = stack.splice(current[1],2);
                    code = c[0];
                    env = c[1];
                    break;
                default:
                    throw new Error("Runtime error while executing instruction " + JSON.stringify(current));
            }

            if (this.debug) {
                if (!measures[instruction]) {
                    measures[instruction] = { 
                        name: $i.toString(instruction), 
                        duration: 0, 
                        hits: 0 
                    };
                }
                
                measures[instruction].duration = measures[instruction].duration + (Date.now() - t0);
                measures[instruction].hits = measures[instruction].hits + 1;

                t0 = Date.now();
            }
        }
        
        return stack;
    };
    
    Runtime.prototype.executeCode = function(toExecute, initialEnv, measures) {        
        return this.executeNextCode(toExecute,initialEnv,measures).shift();
    };
    
    Runtime.prototype.execute = function(toExecute) {
        var t0 = Date.now(),
            measures = new Array(28);
        
        try {
            return this.executeCode(toExecute, [], measures);
        } finally {
            if (this.debug) {
                var total = Date.now() - t0,
                    hits = 0,
                    k;
                
                for(k in measures) {
                    hits += measures[k].hits;
                }
                
                for (k in measures) {                
                    console.log("Takes " + 
                                measures[k].duration + " ms (" + Math.floor(100*measures[k].duration/total) +"%)\t | " +
                                measures[k].hits     + " hits (" + Math.floor(100*measures[k].hits/hits) +"%)\t | " +
                                Math.floor(10000*(measures[k].duration/(1+measures[k].hits))) + "w\t | " + measures[k].name);
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
