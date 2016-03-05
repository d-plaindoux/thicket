/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    "use strict";
        
    function Machine(code, env, stack, measures) {
        this._code = code;
        this._env = env;
        this._stack = [];
        
        this.t0 = 0;
        this.measures = measures;
    }
    
    Machine.prototype.setEnv = function(env) {
        this._env = env.slice(); 
        return this;
    };
    
    Machine.prototype.elementAtIndexFromEnv = function(index) {
        if (index < 0) {
            return this._env[this._env.length + index];            
        }
        
        return this._env[index];
    };
      
    Machine.prototype.elementsFromEnv = function(min,max) {
        return this._env.slice(min,max);
    };
    
    Machine.prototype.getEnv = function() {
        return this._env;  
    };
    
    Machine.prototype.hasNextCode = function() {
        return this._code.length !== 0;
    };

    Machine.prototype.getNextCode = function() {
        return this._code.shift();
    };

    Machine.prototype.setCode = function(code) {
        this._code = code.slice(); 
        return this;
    };
    
    Machine.prototype.pushCode = function(code) {
        this._code = code.concat(this._code);
        return this;
    };
    
    Machine.prototype.getCode = function() {
        return this._code;
    };
    
    Machine.prototype.valueToStack = function(value) {
        this._stack.unshift(value);  
        return this;
    };
    
    Machine.prototype.codeToStack = function(code) {
        this._stack.unshift(code);  
        return this;
    };
    
    Machine.prototype.envToStack = function(env) {
        this._stack.unshift(env);  
        return this;
    };
    
    Machine.prototype.valueFromStack = function() {
        return this._stack.shift();  
    };
    
    Machine.prototype.codeFromStack = function() {
        return this._stack.shift();  
    };
    
    Machine.prototype.envFromStack = function() {
        return this._stack.shift();  
    };
    
    Machine.prototype.elementAtIndexFromStack = function(index) {
        return this._stack[index];  
    };
    
    Machine.prototype.getStack = function() {
        return this._stack;
    };
    
    return function(code, env, stack, measures) {
        return new Machine(code, env, stack, measures);
    };    
}());