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
        try {
            return Object.keys(struct)[0];
        } catch (e) {
            return null;
        }
    }
    
    function close(i, t) {
        if (i <= 0) {
            return t;
        }
        
        return [{CLOSURE:close(i-1, t).concat([{RETURN:1}])}];
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
                        
                        if (render && name === "unit") {
                            return "()";
                        }

                        if (render && ["number","string"].indexOf(name) !== -1) {
                            return pretty(render)(code[1]);
                        }

                        return "<" + type.toLowerCase() + " " + name + ">";
                    case 'NATIVE':
                        return "<NATIVE '" + code.NATIVE[0] + "'>";
                    case 'CACHED':
                        if (code.CACHED[2]) {
                            return "<CACHED " + pretty(render)(code.CACHED[2]) + ">";
                        }
                        
                        return "<CACHED " + pretty(render)(code.CACHED) + ">";
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
    
    Runtime.prototype.getIdent = function(name) {
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
        this.pretty(alteration);
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

    var MEASURE = {};
    
    Runtime.prototype.hasBeenEvaluated = function(code) {
        if (!code.CACHED) {
            return code;
        } else if (code.CACHED[2]) {
            return code.CACHED[2];
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
                case "NATIVE":
                case "CLASS":
                case "MODEL":                      
                  if (instruction === "NATIVE") {
                        m = current.NATIVE[1];
                        stack.unshift([{R_NATIVE:current.NATIVE}].concat(code), env);        
                    } else if (instruction === "MODEL") {
                        m = current.MODEL[1].length;
                        stack.unshift([{R_MODEL:[current,m]}].concat(code), env);
                    } else {
                        m = 1;
                        stack.unshift([{R_CLASS:current}].concat(code), env);
                    }
                    
                    for(n = 0; n < m; n++) {
                        v = env[n];
                        r = this.hasBeenEvaluated(v);                            
                        if (r) {
                            stack.unshift([{RESULT:r},{R_RETURN:m-n}], []);
                        } else {
                            stack.unshift(v.CACHED[0].concat([{R_CACHED:v.CACHED},{R_RETURN:m-n}]), v.CACHED[1].slice());
                        }
                    }    
                    code = stack.shift();
                    env = stack.shift();
                    break;
                case "MODEL":  
                    stack.unshift({OBJ:[current,env.slice(0,current.MODEL[1].length)]});
                    break;
                case "DEFINITION":
                    stack.unshift(code, env);                    
                    code = current.DEFINITION[1].concat([{RETURN:1}]);
                    env = [];                    
                    break;
                case "CONST":
                    stack.unshift(current);                    
                    break;
                case "IDENT":
                    code = this.getIdent(current.IDENT).concat(code);                    
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
                    
                    r = this.hasBeenEvaluated(v);                                    
                    if (r) {
                        stack.unshift(r);
                        code = [{R_ALTER:n}].concat(code);
                    } else {
                        stack.unshift([{R_ALTER:n}].concat(code), env);
                        env = v.CACHED[1].slice();
                        code = v.CACHED[0].concat([{R_CACHED:v.CACHED},{R_RETURN:1}]);
                    }                                        
                    break;                    
                case "INVOKE":
                case "TAILINVOKE":
                    v = current[instruction];
                    c = stack.shift();  
                    
                    if (instruction === 'INVOKE') {
                        stack.unshift(code, env);
                    }                        

                    r = this.hasBeenEvaluated(c);                        
                    if (r) {                        
                        stack.unshift(r);
                        code = [{R_ANYINVOKE:v}].concat(code);
                    } else {
                        stack.unshift([{R_ANYINVOKE:v}].concat(code), env);
                        env = c.CACHED[1].slice();
                        code = c.CACHED[0].concat([{R_CACHED:c.CACHED},{R_RETURN:1}]);
                    }                    
                    break;                          
                case "APPLY":
                case "TAILAPPLY":
                    v = stack.shift();
                    c = stack.shift();  
                    
                    if (instruction === 'APPLY') {
                        stack.unshift(code, env);
                    }
                    
                    r = this.hasBeenEvaluated(c);                        
                    if (r) {                        
                        stack.unshift(r);
                        code = [{R_ANYAPPLY:v}].concat(code);
                    } else {
                        stack.unshift([{R_ANYAPPLY:v}].concat(code), env);
                        env = c.CACHED[1].slice();
                        code = c.CACHED[0].concat([{R_CACHED:c.CACHED},{R_RETURN:1}]);
                    }                    
                    break;                          
                case "RETURN":
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
                        env = v.CACHED[1].slice();   
                        code = v.CACHED[0].concat([{R_CACHED:v.CACHED},{R_RETURN:1}]);
                    }                     
                    break;                        
                case "PUSH":
                    stack.unshift({CACHED:[current.PUSH, env.slice()]});
                    break;
                case "CACHED":
                    c = current;
                    r = this.hasBeenEvaluated(c);                        
                    if (r) {                        
                        stack.unshift(r);
                    } else {
                        stack.unshift(code, env);
                        env = c.CACHED[1].slice();
                        code = c.CACHED[0].concat([{R_CACHED:c.CACHED},{R_RETURN:1}]);
                    }
                    break;
                    
                // -----------------------------------------------------------------
                // SPECIFIC CODE FOR CACHED CODE AND DEFERRED CONSTRUCTION
                // Objcode only generated during runtime process i.e. Not GENERATED
                // -----------------------------------------------------------------
                    
                case "RESULT":
                    stack.unshift(current.RESULT);                    
                    break;
                case "R_ALTER":
                    v = stack.shift();
                    c = stack.shift();
                    stack.unshift(this.alterAttribute(c,current.R_ALTER,v));
                    break;
                case "R_CACHED":
                    current.R_CACHED[2] = stack[0];
                    break;
                case "R_MODEL":
                    p = stack.splice(0,current.R_MODEL[1]);
                    stack.unshift({OBJ:[current.R_MODEL[0],p]});  
                    break;     
                case "R_CLASS":
                    p = stack.shift();
                    stack.unshift({OBJ:[current.R_CLASS,p]});  
                    break;     
                case "R_NATIVE":
                    p = stack.splice(0,current.R_NATIVE[1]);
                    code = this.external[current.R_NATIVE[0]](p).concat([{RETURN:1}]).concat(code);
                    break;    
                case "R_ANYAPPLY":
                    c = stack.shift();
                    env = c.ENV[1].slice();
                    code = c.ENV[0].slice();
                    env.unshift(current.R_ANYAPPLY);                 
                    break;
                case "R_ANYINVOKE":
                    v = current.R_ANYINVOKE;
                    c = stack.shift();                        
                    if (isClassInstance(c.OBJ[0])) {
                        code = this.lookupMethod(c.OBJ[0], c.OBJ[1], v).concat([{RETURN:1}]);
                        env = [];
                        env.unshift({OBJ:[c.OBJ[0], c.OBJ[1]]}, c.OBJ[1]);
                    } else {
                        code = this.lookupAttribute(c.OBJ[0], v).concat([{RETURN:1}]);
                        env = c.OBJ[1].slice();
                    }
                    break;
                case "R_RETURN":
                    c = stack.splice(current.R_RETURN,2);
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
                MEASURE[instruction].hits     = MEASURE[instruction].hits + 1;
                
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
                                Math.floor(10000*(MEASURE[k].duration/(1+MEASURE[k].hits))) + "w\t | " + 
                                
                                k);
                }
                
                console.log("Total time " + total);
            }
        }
    };

    return function() {
        return new Runtime();    
    };
}());
