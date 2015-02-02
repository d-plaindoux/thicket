/*global exports, document*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.M = (function() {
    
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
    }
    
    function Apply(f,a) {
        this.abstraction = f;
        this.argument = a;
    }
    
    function Atom(a) {
        this.atom = a;
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
        this.environment = {};
    }
    
    // ---------------------------------------------------------
    // Dictionnary
    // ---------------------------------------------------------

    Movico.prototype.define = function (name, entity) {
        this.environment[name] = entity;
    };
    
    // ---------------------------------------------------------
    // Abstract instructions    
    // ---------------------------------------------------------    

    Movico.prototype.unit = new Atom(null);
    
    Movico.prototype.string = function(s) {
        return new Atom(s);
    };
    
    Movico.prototype.number = function(n) {
        return new Atom(n);
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
    
    Movico.prototype.$$ = function(code) {
        switch (getType(code)) {
            case 'Atom':
                return code.atom;
            case 'Lazy':
                return this.$$(code.value());
            case 'Apply':
                return this.$$(this.$$(code.abstraction)(code.argument));
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
                return this.$$(this.$$(code.instance)[code.name]);
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