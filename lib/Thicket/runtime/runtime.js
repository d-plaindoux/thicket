/*jshint -W061 */

/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    "use strict";
    
    var $i = require('./instruction.js'),
        $m = require('./machine.js');
    
    // ------------------------------------------------------------------------------------------------
    // Private bahaviors
    // ------------------------------------------------------------------------------------------------
    
    function isClassInstance(value) {
        return getInstruction(value) === $i.code.CLASS;
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
        if (i > 0) {
            return [[ $i.code.CLOSURE , close(i-1, t).concat([[ $i.code.RETURN ]]) ]];
        }

        return t;
    }
    
    function pretty(code) {
        var type, name;

        if (code[0] instanceof Array) {
            type = getInstruction(code[0]);

            switch (type) {
                case $i.code.OBJ:
                    return pretty(code[1]);
                case $i.code.MODEL:
                case $i.code.CLASS:
                    name = code[0][1][0];
                    switch (name) {
                        case "unit":
                            return "()";
                        case "number":
                            return code[1][1];
                        case "char":
                            return "'" + code[1][1].replace(/'/g,"\\'") + "'";
                        case "string":                    
                            return '"' + code[1][1].replace(/"/g,'\\"') + '"';
                        default:
                            return "<" + (type === 8 ? "model" : "class") + " " + name + ">";
                    }
                    
                    break;
                default:
                    return "[" + code.map(pretty).join(",") + "]";
            }
        } else {        
            type = getInstruction(code);

            switch (getInstruction(code)) {
                case $i.code.OBJ:
                    return pretty(code[1]);
                case $i.code.CLOSURE:
                case $i.code.ENV:
                    return "<function>";
                default:
                    return JSON.stringify(code[1]);
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

    Runtime.prototype.loadPackage = function(name) {
        var that = this;

        return this.reader.map(function (reader) {
            var native = reader.addPackageCode(reader.packageCode(name));
            native.forEach(function(native) {
                var code = reader.native(native);
                eval(code)(that);
            });
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
    
    function getNamespace(n) {
        var names = n.split(".");
        names.pop();
        return names.join(".");
    }        

    Runtime.prototype.getIdent = function(name) {        
        if (this.idents[name]) {
            return this.idents[name];
        } 

        this.loadModule(getNamespace(name));

        if (this.idents[name]) {
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
        var modelName  = value[1][0],
            attributes = value[1][1],
            entries    = value[1][2],
            index      = entries.indexOf(name);

        if (index > -1) { 
            return attributes[index];
        }

        throw new Error("Attribute " + name + " not found in " + modelName);
    };   

    Runtime.prototype.alterValue = function(value, name, alteration) {
        var instruction = getInstruction(value[1][0]),
            values,
            entries,
            indice;
        
        switch (instruction) {
            case $i.code.MODEL:
                entries = value[1][0][1][2];
                indice = entries.indexOf(name);
                
                values = value[1][1].map(function(v,index) {
                    if (indice === (value[1][1].length - 1 - index)) {
                        return alteration;
                    } else {
                        return v;
                    }
                });

                return [ $i.code.OBJ, [value[1][0], 
                                       values
                                      ] 
                       ];

            case $i.code.CLASS:
                entries = value[1][0][1][2];
                indice = entries.indexOf(name);
                
                values = value[1][0][1][1].map(function(v,index) {
                    if (indice === index) {
                        return [[$i.code.RESULT, alteration],[$i.code.RETURN]];
                    } else {
                        return v;
                    }
                });
                
                // OMG /o\

                return [ $i.code.OBJ, [[value[1][0][0], 
                                        [value[1][0][1][0], 
                                         values, 
                                         value[1][0][1][2], 
                                         value[1][0][1][3]
                                        ]
                                       ],
                                       value[1][1]] 
                       ];
            default:
                throw new Error("Definition " + name + " not found in " + instruction);
        }
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
        if (code[0] === $i.code.CACHED) {
            return code[1][2];
        } else {
            return code;
        }
    };
    
    Runtime.prototype.execute_PARAMETER = function(runtime, v, i) {
        var r = this.hasBeenEvaluated(v);                            
        if (r) {
            runtime.envToStack([]);
            runtime.codeToStack([[ $i.code.RESULT, r ],[ $i.code.R_RETURN, i ]]);
        } else {
            runtime.envToStack(v[1][1]);
            runtime.codeToStack(v[1][0].concat([[ $i.code.R_CACHED, v[1] ], [ $i.code.R_RETURN, i ]]));
        }
    };
    
    Runtime.prototype.execute_NATIVE = function(runtime, current) {
        var m = current[1][1];
        
        runtime.envToStack(runtime.getEnv());        
        runtime.pushCode([[ $i.code.R_NATIVE, current[1] ]]);
        runtime.codeToStack(runtime.getCode());        

        for(var n = 0; n < m; n++) {
            this.execute_PARAMETER(runtime, runtime.elementAtIndexFromEnv(n), m-n);
        }    
        
        runtime.setCode(runtime.codeFromStack());
        runtime.setEnv(runtime.envFromStack());
    };
    
    Runtime.prototype.execute_CLASS = function(runtime, current) {
        var m = 1;
        
        runtime.envToStack(runtime.getEnv());        
        runtime.pushCode([[ $i.code.R_CLASS, current ]]);
        runtime.codeToStack(runtime.getCode());        

        for(var n = 0; n < m; n++) {
            this.execute_PARAMETER(runtime, runtime.elementAtIndexFromEnv(n), m-n);
        }    

        runtime.setCode(runtime.codeFromStack());
        runtime.setEnv(runtime.envFromStack());
    };
    
    Runtime.prototype.execute_MODEL = function(runtime, current) {
        var m = current[1][1].length;
        
        runtime.envToStack(runtime.getEnv());        
        runtime.pushCode([[ $i.code.R_MODEL, [current, m] ]]);
        runtime.codeToStack(runtime.getCode());        

        for(var n = 0; n < m; n++) {
            this.execute_PARAMETER(runtime, runtime.elementAtIndexFromEnv(n), m-n);
        } 
        
        runtime.setCode(runtime.codeFromStack());
        runtime.setEnv(runtime.envFromStack());
    };
    
    Runtime.prototype.execute_DEFINITION = function(runtime, current) {
        runtime.envToStack(runtime.getEnv());                    
        runtime.codeToStack(runtime.getCode());                    
        
        runtime.setEnv([]);                    
        runtime.setCode([[ $i.code.RETURN ]]).pushCode(current[1][1]);
    };
    
    Runtime.prototype.execute_IDENT = function(runtime, current) {
        runtime.pushCode(this.getIdent(current[1]));                    
    };
    
    Runtime.prototype.execute_ALTER = function(runtime, current) {
        var m = 2,
            c = [ runtime.valueFromStack(), runtime.valueFromStack() ]; // TODO - remove this ugly code

        runtime.envToStack(runtime.getEnv());        
        runtime.pushCode([[ $i.code.R_ALTER, current[1] ]]);
        runtime.codeToStack(runtime.getCode());        

        for(var n = 0; n < m; n++) {
            this.execute_PARAMETER(runtime, c[n], m-n);
        }  

        runtime.setCode(runtime.codeFromStack());
        runtime.setEnv(runtime.envFromStack());
    };
    
    Runtime.prototype.execute_INVOKE = function(runtime, current, notTail) {
        var v = current[1],
            c = runtime.valueFromStack(), 
            r = this.hasBeenEvaluated(c);

        if (notTail) {
            runtime.envToStack(runtime.getEnv());        
            runtime.codeToStack(runtime.getCode());        
        }

        if (r) {                        
            runtime.valueToStack(r);
            runtime.setCode([[ $i.code.R_ANYINVOKE, v ]]);
        } else {
            runtime.envToStack(runtime.getEnv());        
            runtime.codeToStack([[ $i.code.R_ANYINVOKE, v ]]);        

            runtime.setEnv(c[1][1]);
            runtime.setCode([[ $i.code.R_CACHED, c[1] ], [ $i.code.R_RETURN, 1 ]]).pushCode(c[1][0]);
        }                    
    };

    Runtime.prototype.execute_APPLY = function(runtime, notTail) {
        var v = runtime.valueFromStack(),
            c = runtime.valueFromStack(),
            r = this.hasBeenEvaluated(c);                    
        
        if (notTail) {
            runtime.envToStack(runtime.getEnv());        
            runtime.codeToStack(runtime.getCode());        
        }

        if (r) {                        
            runtime.valueToStack(r);
            runtime.setCode([[ $i.code.R_ANYAPPLY, v ]]);
        } else {
            runtime.envToStack(runtime.getEnv());        
            runtime.codeToStack([[ $i.code.R_ANYAPPLY, v ]]);        
            
            runtime.setEnv(c[1][1]);
            runtime.setCode([[ $i.code.R_CACHED, c[1] ], [ $i.code.R_RETURN, 1 ]]).pushCode(c[1][0]);
        }                    
    };
    
    Runtime.prototype.execute_RETURN = function(runtime) {
        var v = runtime.valueFromStack(),
            r = this.hasBeenEvaluated(v);                    
        
        if (r) {                        
            runtime.setCode(runtime.codeFromStack());
            runtime.setEnv(runtime.envFromStack());
            runtime.valueToStack(r);
        } else {
            runtime.setEnv(v[1][1]);   
            runtime.setCode([[ $i.code.R_CACHED, v[1] ], [ $i.code.R_RETURN, 1 ]]).pushCode(v[1][0]);
        }
    };
    
    Runtime.prototype.execute_CACHED = function(runtime, current) {
        var c = current,
            r = this.hasBeenEvaluated(c);                        
        
        if (r) {                        
            runtime.valueToStack(r);
        } else {
            runtime.envToStack(runtime.getEnv());
            runtime.codeToStack(runtime.getCode());
            runtime.setEnv(c[1][1]);
            runtime.setCode([[ $i.code.R_CACHED, c[1] ], [ $i.code.R_RETURN, 1 ]]).pushCode(c[1][0]);
        }
    };
    
    Runtime.prototype.execute_R_ALTER = function(runtime, current) {
        var v = runtime.valueFromStack(),
            c = runtime.valueFromStack();
        
        runtime.valueToStack(this.alterValue(c,current[1],v));
    };
    
    Runtime.prototype.execute_R_MODEL = function(runtime, current) {
        var p = runtime.valuesFromStack(0,current[1][1]);
        
        runtime.valueToStack([ $i.code.OBJ, [current[1][0],p] ]);  
    };
    
    Runtime.prototype.execute_R_CLASS = function(runtime, current) {
        var p = runtime.valueFromStack();
        
        runtime.valueToStack([ $i.code.OBJ, [current[1],p] ]);  
    };     
     
    Runtime.prototype.execute_R_NATIVE = function(runtime, current) {
        var p = runtime.valuesFromStack(0,current[1][1]);
        
        runtime.pushCode([[ $i.code.RETURN ]]).pushCode(this.external[current[1][0]](p, runtime.measures));
        
        if (this.debug) {
            runtime.t0 = Date.now();
        }
    };
    
    Runtime.prototype.execute_R_ANYAPPLY = function(runtime, current) {
        var c = runtime.valueFromStack();
        
        runtime.setEnv([current[1]].concat(c[1][1]));
        runtime.setCode(c[1][0]);
    };
        
    Runtime.prototype.execute_R_ANYINVOKE = function(runtime, current) {
        var v = current[1],
            c = runtime.valueFromStack();                        
        
        if (isClassInstance(c[1][0])) {
            runtime.setCode([[ $i.code.RETURN ]]).pushCode(this.lookupMethodOrInternal(c[1][0], c[1][1], v));
            runtime.setEnv([[ $i.code.OBJ, [c[1][0], c[1][1]] ], c[1][1]]);
        } else {
            runtime.setEnv(c[1][1]);
            runtime.setCode([[ $i.code.RETURN ]]).pushCode(this.lookupAttribute(c[1][0], v));
        }
    };
    
    Runtime.prototype.execute_R_RETURN = function(runtime, current) {
        var c = runtime.valuesFromStack(current[1],2);
        
        runtime.setEnv(c[1]);
        runtime.setCode(c[0]);
    };  

    Runtime.prototype.executeNextInstruction = function(runtime, current, instruction) {
        switch(instruction) {                   
            case $i.code.NATIVE:
                this.execute_NATIVE(runtime, current);
                break;

            case $i.code.CLASS:
                this.execute_CLASS(runtime, current);
                break;

            case $i.code.MODEL:                      
                this.execute_MODEL(runtime, current);
                break;

            case $i.code.DEFINITION:
                this.execute_DEFINITION(runtime, current);
                break;

            case $i.code.CONST:
                runtime.valueToStack(current);                    
                break;

            case $i.code.IDENT:
                this.execute_IDENT(runtime, current);
                break;

            case $i.code.ACCESS:
                runtime.valueToStack(runtime.elementAtIndexFromEnv(-current[1]));                    
                break;

            case $i.code.CLOSURE:
                runtime.valueToStack([ $i.code.ENV, [current[1], runtime.getEnv()] ]);                    
                break;

            case $i.code.ALTER:
                this.execute_ALTER(runtime, current);
                break;                    

            case $i.code.INVOKE:
                this.execute_INVOKE(runtime, current, true);
                break;

            case $i.code.TAILINVOKE:
                this.execute_INVOKE(runtime, current, false);
                break;

            case $i.code.APPLY:
                this.execute_APPLY(runtime, true);
                break;                          

            case $i.code.TAILAPPLY:
                this.execute_APPLY(runtime, false);
                break;                          

            case $i.code.RETURN:
                this.execute_RETURN(runtime, current);
                break;                        

            case $i.code.PUSH:
                runtime.valueToStack([ $i.code.CACHED, [current[1], runtime.getEnv()] ]);
                break;

            case $i.code.CACHED:
                this.execute_CACHED(runtime, current);                
                break;

            // -----------------------------------------------------------------
            // SPECIFIC code FOR CACHED code AND DEFERRED CONSTRUCTION
            // Objcode only generated during runtime process i.e. Not GENERATED
            // -----------------------------------------------------------------

            case $i.code.RESULT:
                runtime.valueToStack(current[1]);
                break;

            case $i.code.R_ALTER:
                this.execute_R_ALTER(runtime, current);
                break;

            case $i.code.R_CACHED:
                current[1][2] = runtime.elementAtIndexFromStack(0);
                break;

            case $i.code.R_MODEL:
                this.execute_R_MODEL(runtime, current);
                break;     

            case $i.code.R_CLASS:
                this.execute_R_CLASS(runtime, current);
                break;     

            case $i.code.R_NATIVE:
                this.execute_R_NATIVE(runtime, current);
                break;    

            case $i.code.R_ANYAPPLY:
                this.execute_R_ANYAPPLY(runtime, current);
                break;
            case $i.code.R_ANYINVOKE:
                this.execute_R_ANYINVOKE(runtime, current);
                break;

            case $i.code.R_RETURN:
                this.execute_R_RETURN(runtime, current);                
                break;

            default:
                throw new Error("Runtime error while executing instruction " + $i.toString(instruction));
        }
    };

    Runtime.prototype.measureInstructionOverhead = function(runtime, instruction) {
        if (!runtime.measures[instruction]) {
            runtime.measures[instruction] = { 
                name: $i.toString(instruction), 
                duration: 0, 
                hits: 0 
            };
        }

        runtime.measures[instruction].duration = runtime.measures[instruction].duration + (Date.now() - runtime.t0);
        runtime.measures[instruction].hits = runtime.measures[instruction].hits + 1;

        runtime.t0 = Date.now();        
    };
    
    Runtime.prototype.executeNextCode = function(initialCode, initialEnv, measures) {
        var runtime = $m(initialCode, initialEnv, [], measures);
        
        if (this.debug) {
            runtime.t0 = Date.now();
        }
        
        while (runtime.hasNextCode()) {    
            var current = runtime.getNextCode(),
                instruction = getInstruction(current);
            
            this.executeNextInstruction(runtime, current, instruction);
            
            if (this.debug) {
                this.measureInstructionOverhead(runtime, instruction);
            }
        }
        
        return runtime.getStack();
    };
    
    Runtime.prototype.executeCode = function(toExecute, initialEnv, measures) {        
        return this.executeNextCode(toExecute,initialEnv,measures).shift();
    };
    
    Runtime.prototype.execute = function(toExecute) {
        var t0 = Date.now(),
            measures = new Array(28);
        
        try {
            return this.executeNextCode(toExecute, [], measures).shift();
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
