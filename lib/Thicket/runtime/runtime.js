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
    
    function isModelInstance(value) {
        return getInstruction(value) === $i.code.MODEL;
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
    
    function apply(i, t) {
        if (i > 0) {
            return apply(i-1, t).concat([[ $i.code.ACCESS, i ], [ $i.code.EVAL ], [ $i.code.APPLY ]]);
        }

        return t; 
    }

    function closure(i, t) {
        if (i > 0) {
            return [[ $i.code.CLOSURE , closure(i-1, t).concat([[ $i.code.RETURN ]]) ]];
        }

        return t ;
    }
    
    function close(name, i, t) {
        // Explanation - Force code evaluation using GRAB for each element in the activation frame
        return [[ $i.code.DEFINITION, [ name, closure(i,apply(i,closure(i,t))).concat([[ $i.code.RETURN ]]) ] ]];
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
                case $i.code.ENV:
                    return "<function>";
                default:
                    return JSON.stringify(code[1]);
            }
        }
    }
    
    // ------------------------------------------------------------------------------------------------
    // constructor
    // ------------------------------------------------------------------------------------------------
    
    function Runtime(reader) {
        this.reader = reader;
        this.debug = false;
        this.declarations = {};
        this.definitions = {};
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

    Runtime.prototype.getDefinition = function(name) {        
        if (this.definitions[name]) {
            return this.definitions[name];
        } 

        this.loadModule(getNamespace(name));

        if (this.definitions[name]) {
            return this.definitions[name];
        } 
        
        throw new Error("No definition available for " + name);
    };
    
    Runtime.prototype.setDefinition = function(name, value) {
        this.definitions[name] = value;
    };

    Runtime.prototype.getDeclaration = function(name) {        
        if (this.declarations[name]) {
            return this.declarations[name];
        } 

        this.loadModule(getNamespace(name));

        if (this.declarations[name]) {
            return this.declarations[name];
        } 
        
        throw new Error("No definition available for " + name);
    };
    
    Runtime.prototype.setDeclaration = function(name, value) {
        this.declarations[name] = value;
    };
    
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
            var derivation = this.getDefinition(derivations[i]);
            if (isClassInstance(derivation)) {
                entry = this.lookupMethod(derivation, model, name);
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
                        return [[ $i.code.RESULT, alteration ],[ $i.code.RETURN ]];
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
        this.delta[name] = [[ $i.code.NATIVE, [name,arity,value] ], [ $i.code.RETURN ]];
    };
    
    Runtime.prototype.native = function(name, arity, value) {
        // self closure implicit evaluation
        if (this.delta[name]) {
            throw new Error("Native method " + name + " aleady exist");
        }
        
        this.delta[name] = close(name, arity,[[ $i.code.NATIVE, [name,arity,value] ]]);
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
                this.setDeclaration(fullyQualifiedName(current[1][0]), close(current[1][0], current[1][1].length, [current]));
                break;
            case $i.code.CLASS:
                current[1][3] = current[1][2];
                current[1][2] = current[1][1].map(function(e) { return e[0]; });
                current[1][1] = current[1][1].map(function(e) { return e[1]; });
                this.setDeclaration(fullyQualifiedName(current[1][0]), close(current[1][0], 1, [current]));
                this.setDefinition(fullyQualifiedName(current[1][0]), current);
                break;
            case $i.code.DEFINITION:
                this.setDeclaration(fullyQualifiedName(current[1][0]), [current]);
                break;
        }
    };
      
    Runtime.prototype.constant = function(value) {
        if (value[0] === $i.code.CONST) {
            return value[1];
        } else if (value[0] === $i.code.OBJ) {        
            return this.constant(value[1][1]);
        }

        throw new Error("Waiting for an object not a [" + $i.toString(getInstruction(value)) + "]");
    };

    Runtime.prototype.execute_NATIVE = function(runtime, current) {
        var p = runtime.elementsFromEnv(0, current[1][1]);

        runtime.pushCode(current[1][2](p, runtime.measures));
        
        if (this.debug) {            
            this.resetTimerForMeasurement(runtime);
        }
    };
    
    Runtime.prototype.execute_CLASS = function(runtime, current) {
        var p = runtime.elementAtIndexFromEnv(0);
      
        runtime.valueToStack([ $i.code.OBJ, [current, p] ]);  
    };
    
    Runtime.prototype.execute_MODEL = function(runtime, current) {
        var p = runtime.elementsFromEnv(0, current[1][1].length);
        
        runtime.valueToStack([ $i.code.OBJ, [current, p] ]);  
    };
    
    Runtime.prototype.execute_DEFINITION = function(runtime, current) {
        runtime.envToStack(runtime.getEnv());                    
        runtime.codeToStack(runtime.getCode());                    
        
        runtime.setEnv([]);                    
        runtime.setCode(current[1][1]);
    };
    
    Runtime.prototype.execute_IDENT = function(runtime, current) {
        runtime.pushCode(this.getDeclaration(current[1]));                    
    };
    
    Runtime.prototype.execute_ALTER = function(runtime, current) {
        var v = runtime.valueFromStack(),
            c = runtime.valueFromStack();
        
        runtime.valueToStack(this.alterValue(c,current[1],v));
    };
    
    Runtime.prototype.execute_INVOKE = function(runtime, current, notTail) {
        var v = current[1],
            c = runtime.valueFromStack();

        if (notTail) {
            runtime.envToStack(runtime.getEnv());        
            runtime.codeToStack(runtime.getCode());        
        }

        if (isClassInstance(c[1][0])) {
            runtime.setCode(this.lookupMethodOrInternal(c[1][0], c[1][1], v));
            runtime.setEnv([[ $i.code.OBJ, [c[1][0], c[1][1]] ], c[1][1]]);
        } else if (isModelInstance(c[1][0])) { 
            runtime.setEnv(c[1][1]);
            runtime.setCode(this.lookupAttribute(c[1][0], v));
        } else {        
            throw new Error("Waiting for a class or model instance [" + $i.toString(getInstruction(c[1][0][0])) + "]");
        }
    };

    Runtime.prototype.execute_APPLY = function(runtime, notTail) {
        var v = runtime.valueFromStack(),
            c = runtime.valueFromStack();
        
        if (notTail) {
            runtime.envToStack(runtime.getEnv());        
            runtime.codeToStack(runtime.getCode());        
        }
        
        runtime.setEnv([v].concat(c[1][1]));
        runtime.setCode(c[1][0]);
    };
    
        
    Runtime.prototype.execute_RETURN = function(runtime) {
        var v = runtime.valueFromStack(),
            c = runtime.codeFromStack(),
            e = runtime.envFromStack();

        runtime.setEnv(e);
        runtime.setCode(c);

        runtime.valueToStack(v);

        this.execute_EVAL(runtime);
    };

    function isDeferred(code) {
        return code[0] === $i.code.DEFERRED;
    }

    function getEvaluated(code) {
        return code[1][2];
    }

    Runtime.prototype.execute_EVAL = function(runtime) {

        if (isDeferred(runtime.elementAtIndexFromStack(0))) {  
            var v = runtime.valueFromStack(),
                code = getEvaluated(v);
            
            if (code) {
                runtime.valueToStack(code);
            } else {
                runtime.envToStack(runtime.getEnv());
                runtime.codeToStack(runtime.getCode());

                runtime.setEnv(v[1][1]);   
                runtime.setCode([[ $i.code.CACHED, v[1] ], [ $i.code.RETURN ]]).pushCode(v[1][0]);
            }
        }
    };
    
    Runtime.prototype.execute_PUSH = function(runtime, current) {
        runtime.valueToStack([ $i.code.DEFERRED, [current[1], runtime.getEnv()] ]);                    
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
                this.execute_RETURN(runtime);
                break;                        

            case $i.code.EVAL:
                this.execute_EVAL(runtime);
                break;                        

            case $i.code.PUSH:
                this.execute_PUSH(runtime, current);
                break;

            case $i.code.DEFERRED:
                this.execute_DEFERRED(runtime, current);                
                break;

            // -----------------------------------------------------------------
            // SPECIFIC code FOR DEFERRED code AND DEFERRED CONSTRUCTION
            // Objcode only generated during runtime process i.e. Not GENERATED
            // -----------------------------------------------------------------

            case $i.code.RESULT:
                runtime.valueToStack(current[1]);
                break;

            case $i.code.CACHED:
                current[1][2] = runtime.elementAtIndexFromStack(0);
                break;

            default:
                throw new Error("Runtime error while executing instruction " + JSON.stringify(current));
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
    
    Runtime.prototype.resetTimerForMeasurement = function(runtime) {
        runtime.t0 = Date.now();
    };
    
    Runtime.prototype.displayMeasureInstructionOverhead = function(t0, measures) {
        var total = Date.now() - t0,
            hits = 0,
            k;
                
        for(k in measures) {
            hits += measures[k].hits;
        }
                    
        for (k in measures) {                
            console.log("| " + 
                        measures[k].duration + " ms (" + Math.floor(100*measures[k].duration/total) +"%)\t | " +
                        measures[k].hits     + " hits (" + Math.floor(100*measures[k].hits/hits) +"%)\t | " +
                        Math.floor(10000*(measures[k].duration/(1+measures[k].hits))) + "w\t | " + measures[k].name);
        }   
                    
        console.log("| " + total + " ms\t | " + 
                    hits + " hits \t | " + 
                    Math.floor(10000*(total/(1+hits))) + "w");        
    };
    
    Runtime.prototype.executeNextCode = function(initialCode, initialEnv, measures) {
        var runtime = $m(initialCode, initialEnv, [], measures);
        
        if (this.debug) {   
            this.resetTimerForMeasurement(runtime);
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
            measures = [];
        
        try {
            return this.executeNextCode(toExecute, [], measures).shift();
        } finally {
            if (this.debug) {
                this.displayMeasureInstructionOverhead(t0, measures);
            }
        }
    };

    return function(reader) {
        return new Runtime(reader);    
    };
}());
