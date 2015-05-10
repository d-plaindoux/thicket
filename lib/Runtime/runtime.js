/*global document*/

/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    "use strict";
    
    var native = require("./native.js");
    
    // ---------------------------------------------------------

    function Lazy(f) {
        this.value = f;
        this.evaluation = undefined;
    }
    
    function Apply(f,a) {
        this.abstraction = f;
        this.argument = a;
    }
    
    function UnitAtom() {
        // Nothing
    }
    
    function Tag(n,a,b) {
        this.name = n;
        this.attributes = a;
        this.body = b;
    }
    
    function Ident(i,n) {
        this.value = i;
        this.namespace = n;
    }
    
    function Invoke(o,n) {
        this.instance = o;
        this.name = n;
    }
    
    function Instance(o) {
        this.instance = o;
    }
    
    function Controller(c) {
        this.controller = c;
    }
    
    function View(c) {
        this.view = c;
    }
    
    // ---------------------------------------------------------
    // Constructor & Facility
    // ---------------------------------------------------------
    
    function Thicket() {
        var that = this;
        that.deltarules = {};
        that.environment = {};
        
        this.extendWith(native);
    }
    
    Thicket.prototype.extendWith = function (extension) {
        return extension(this);
    };
    
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
    
    Thicket.prototype.getType = getType;

    // ---------------------------------------------------------
    // Dictionnary
    // ---------------------------------------------------------

    Thicket.prototype.define = function (name, entity) {
        this.environment[name] = entity;
        return entity;
    };
    
    Thicket.prototype.code = function (name, expression) {
        this.deltarules[name] = expression;
        return expression;
    };
    
    // ---------------------------------------------------------
    // Abstract instructions    
    // ---------------------------------------------------------  
    
    Thicket.prototype.module = function(name, definitions) {
        console.log("Loading " + name);
        definitions();
    };
    
    Thicket.prototype.unit = new UnitAtom();
    
    Thicket.prototype.dom = function(s) {
        return this.apply(this.ident('dom'),s);
    };
    
    Thicket.prototype.string = function(s) {
        return this.apply(this.ident('string'),s);
    };
    
    Thicket.prototype.number = function(n) {
        return this.apply(this.ident('number'),n);
    };
    
    Thicket.prototype.lazy = function(f) {
        return new Lazy(f);
    };
    
    Thicket.prototype.apply = function(f,a) {
        return new Apply(f,a);
    };
    
    Thicket.prototype.tag = function(n,a,f) {
        return new Tag(n,a,f);
    };
    
    Thicket.prototype.ident = function(i,n) {
        return new Ident(i,n);
    };
    
    Thicket.prototype.invoke = function(o,n) {
        return new Invoke(o,n);
    };
    
    Thicket.prototype.instance = function(o) {
        return new Instance(o);
    };
    
    Thicket.prototype.instance = function(o) {
        return new Instance(o);
    };
    
    Thicket.prototype.controller = function(o) {
        return new Controller(o);
    };
    
    Thicket.prototype.view = function(o) {
        return new View(o);
    };
    
    // ---------------------------------------------------------
    // Operational interpretation    
    // ---------------------------------------------------------    
    
    function getId(o) {
        if (getType(o) === 'Object' && o.hasOwnProperty('[id]')) {
            return o['[id]'];
        }
        
        return undefined;
    }
    
    function getNs(o) {
        if (getType(o) === 'Object' && o.hasOwnProperty('[ns]')) {
            return o['[ns]'];
        }
        
        return undefined;
    }
    
    function isModel(o) {
        return getType(o) === 'Object' && o.hasOwnProperty('[id]');
    }
    
    function isClass(o) {
        return isModel(o) && o.hasOwnProperty('[this]');
    }
    
    Thicket.prototype.fun = function(o) {
        var id = getId(o);
        if (id !== undefined) {
            return this.$$(this.ident(id,getNs(o)));
        }
        
        return o;
    };
    
    Thicket.prototype.lookup = function(o,n) {
        var callerName = '';
        
        if (getType(o) === 'Object' && o.hasOwnProperty('[this]')) {
            callerName = getId(this.$$(o['[this]']));            
        }
        
        if (getType(o) === 'Object' && o.hasOwnProperty(callerName + "." + n)) {
            return o[callerName + "." + n];
        }
        
        if (getType(o) === 'Object' && o.hasOwnProperty(n)) {
            return o[n];
        }
         
        if (this.deltarules.hasOwnProperty(getId(o) + "." + n)) {
            return this.deltarules[getId(o) + "." + n](o);
        }
        
        throw new Error("method not found " + (callerName?callerName + ".":"") + n + " in " + o['[id]']);
    };
    
    Thicket.prototype.pretty = function (code) {
        switch (getType(code)) {
            case 'Lazy':
                return "Lazy<...>";
            case 'UnitAtom':
                return '()';
            case 'Apply':
                return this.pretty(code.abstraction) + "(" + this.pretty(code.argument) + ")";
            case 'Tag':
                return "<" + code.name + " ...> ... </" + code.name + ">";
            case 'Ident':
                return code.value;
            case 'Invoke':
                return "(" + this.pretty(code.instance) + ")." + code.name;
            case 'Instance':
                return this.pretty(code.instance);
            case 'Controller':
                return this.pretty(code.controller(code)); // self - transitive closure
            case 'Object':
                if (isModel(code)) {
                    switch (code['[id]']) {
                        case 'number':
                            return code['[this]'];
                        case 'string':
                            return '"' + code['[this]'] + '"';
                        default:
                            if (isClass(code)) {
                                return "<class " + code['[id]'] + ">";
                            } 
                            
                            return "<model " + code['[id]'] + ">";
                    }
                }
                
                return "<object>";
            case 'function':
                return "<function>";                
            default:
                return "<internal>";
        }
    };

    function abortIfUndefined(name, code) {
        if (code) {
            return code;
        }

        throw new Error("Definition not found for " + name);
    }
    
    Thicket.prototype.$$ = function(code) {
        var that = this;

        switch (getType(code)) {
            case 'Lazy':
                if (code.evaluation === undefined && code.value) {                    
                    code.evaluation = that.$$(code.value()); 
                    code.value = undefined;
                }
                return code.evaluation;
            case 'Apply':
                var funcall = that.fun(that.$$(code.abstraction));               
                if (getType(code.argument) === 'Lazy') {
                    return that.$$(funcall(code.argument));
                }                 
                return that.$$(funcall(that.$$(code.argument)));
            case 'Tag':
                var element = that.$$(that.dom(document.createElement(code.name)));
                code.attributes.forEach(function (attribute) {
                    that.$$(that.apply(that.apply(that.invoke(element,"addAttribute"),
                                                  that.string(attribute[0])),
                                       attribute[1]));
                });
                code.body.forEach(function (body) {
                    that.$$(that.apply(that.invoke(element,"addChild"),body));
                });
                return element;
            case 'Ident':
                return that.$$(abortIfUndefined(code.value, that.environment[code.value]));
            case 'Invoke':
                return that.$$(that.lookup(that.$$(code.instance),code.name));
            case 'Instance':
                return code.instance;
            case 'Controller':
                return code.controller(code); // self - fermeture transitive
            case 'View':
                return that.$$(that.invoke(code.view(code),'[render]'));
            default:
                return code;
        }
    };
    
    return new Thicket();
    
}());
