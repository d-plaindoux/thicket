/*global document*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports.M = (function() {
    
    function getType(object) {
        if (typeof(object) === 'object') {
            return object.constructor.toString(object).match(/^function\s(.*)\(/)[1];
        } else {
            return typeof(object);
        }
    }
    
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
    
    function Ident(n) {
        this.value = n;
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
    
    // ---------------------------------------------------------
    // Dictionnary
    // ---------------------------------------------------------
    
    function Movico() {
        var that = this;
        that.deltarules = {};
        that.environment = {};
        /**
         * Basic definitions - default but can be overriden 
         */
        that.define('native', { '[id]':'native' });
        that.define('Pair', function(left) { return function(right) { return { '[id]':'Pair',_1:left, _2:right };};});
        that.define('string', function(native) { return { '[id]':'string',unbox:native };});
        that.define('number', function(native) { return { '[id]':'number',unbox:native };});
        that.define('xml', function(native) { return { '[id]':'string',unbox:native };});
        
        that.code("string.+", function(n1){
            return function(n2){
                var v1 = that.$$(n1)['[this]'],
                    v2 = that.$$(n2)['[this]'];                    
                return that.$$(that.string(v1+""+v2));
            };
        });
            
        that.code("number.+", function(n1){
            return function(n2){
                var v1 = that.$$(n1)['[this]'],
                    v2 = that.$$(n2)['[this]'];                    
                return that.$$(that.number(v1+v2));
            };
        });
            
        that.code("number.*", function(n1){
            return function(n2){
                var v1 = that.$$(n1)['[this]'],
                    v2 = that.$$(n2)['[this]'];                
                return that.$$(that.number(v1*v2));
            };
        });

        that.code("number.-", function(n1){
                return function(n2){
                    var v1 = that.$$(n1)['[this]'],
                        v2 = that.$$(n2)['[this]'];                    
                    return that.$$(that.number(v1-v2));
                };
        });

        that.code("number./", function(n1){
            return function(n2){
                var v1 = that.$$(n1)['[this]'],
                    v2 = that.$$(n2)['[this]'];                    
                return that.$$(that.number(v1/v2));
            };
        });

        that.code("number.toString", function(n1){
            var v1 = that.$$(n1)['[this]'];                
            return that.$$(that.string(v1+"")); // TODO
        });
    }
    
    // ---------------------------------------------------------
    // Dictionnary
    // ---------------------------------------------------------

    Movico.prototype.define = function (name, entity) {
        this.environment[name] = entity;
        return entity;
    };
    
    Movico.prototype.code = function (name, expression) {
        this.deltarules[name] = expression;
        return expression;
    };
    
    // ---------------------------------------------------------
    // Abstract instructions    
    // ---------------------------------------------------------    

    Movico.prototype.unit = new UnitAtom();
    
    Movico.prototype.string = function(s) {
        return this.apply(this.ident('string'),s);
    };
    
    Movico.prototype.number = function(n) {
        return this.apply(this.ident('number'),n);
    };
    
    Movico.prototype.lazy = function(f) {
        return new Lazy(f);
    };
    
    Movico.prototype.apply = function(f,a) {
        return new Apply(f,a);
    };
    
    Movico.prototype.tag = function(n,a,f) {
        return new Tag(n,a,f);
    };
    
    Movico.prototype.ident = function(i) {
        return new Ident(i);
    };
    
    Movico.prototype.invoke = function(o,n) {
        return new Invoke(o,n);
    };
    
    Movico.prototype.instance = function(o) {
        return new Instance(o);
    };
    
    Movico.prototype.instance = function(o) {
        return new Instance(o);
    };
    
    Movico.prototype.controller = function(o) {
        return new Controller(o);
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
    
    function isModel(o) {
        return getType(o) === 'Object' && o.hasOwnProperty('[id]');
    }
    
    function isClass(o) {
        return isModel(o) && o.hasOwnProperty('[this]');
    }
    
    Movico.prototype.fun = function(o) {
        var id = getId(o);
        if (id !== undefined) {
            return this.$$(this.ident(id));
        }
        
        return o;
    };
    
    Movico.prototype.lookup = function(o,n) {
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
    
    Movico.prototype.pretty = function (code) {
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
                return this.pretty(code.controller(code)); // self - fermeture transitive
            case 'Object':
                if (isModel(code)) {
                    switch (code['[id]']) {
                        case 'number':
                            return code['unbox'];
                        case 'string':
                            return '"' + code['unbox'] + '"';
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
    
    Movico.prototype.$$ = function(code) {
        switch (getType(code)) {
            case 'Lazy':
                if (code.evaluation === undefined) {
                    code.evaluation = this.$$(code.value()); 
                }
                return code.evaluation;
            case 'Apply':
                return this.$$(this.fun(this.$$(code.abstraction))(code.argument));
            case 'Tag':
                var element = document.createElement(code.name);
                code.attributes.forEach(function (attribute) {
                    element.appendChild(document.createAttribute(attribute[0],this.$$(attribute[1])));
                });
                code.body.forEach(function (body) {
                    element.appendChild(this.$$(this.$$(body)));
                });
                return element;
            case 'Ident':
                return this.$$(this.environment[code.value]);
            case 'Invoke':
                return this.$$(this.lookup(this.$$(code.instance),code.name));
            case 'Instance':
                return code.instance;
            case 'Controller':
                return code.controller(code); // self - fermeture transitive
            default:
                return code;
        }
    };
    
    return new Movico();
    
}());