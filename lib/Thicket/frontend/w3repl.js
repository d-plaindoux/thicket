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
    
    var option = require('../../Data/option.js');
    
    function Thicket(directory) {
        var driver = option.some(directory).map(function(directory) {
                return require('../resource/drivers/w3driver.js')(directory);
            }),
            dom = require('../runtime/dom.js'),
            backend = require('../runtime/backend.js'),
            native = require('../runtime/native.js'),
            runtime = require('../runtime/runtime.js')().
                        extendWith(native).
                        extendWith(dom).                        
                        extendWith(backend).
                        setDebug(false);
        
        this.directory = directory;
        this.toplevel = require('./toplevel.js')(driver, runtime, true);
        
        this.toplevel.loadSpecificationsAndManage("Boot.Core");
        this.toplevel.loadSpecificationsAndManage("Boot.Client");
    }
    
    Thicket.prototype.instance = function(directory) {
        return new Thicket(directory || this.directory);
    };

    Thicket.prototype.manageScripts = function() {        
        var that = this,
            scripts = document.getElementsByTagName("script");
        
        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            
            switch (scripts[i].getAttribute("type")) {
                case "text/thicket":
                    if (script.getAttribute("src")) {
                        var content = that.toplevel.loadSourceCode(script.getAttribute("src"));
                        
                        if (content.isPresent()) {
                            that.toplevel.manageSourceCode(content.get());
                        }
                    } else {
                        that.toplevel.manageSourceCode(script.innerHTML);                
                    }
                    
                    break;
                case "bin/thicket":
                    if (script.getAttribute("src")) {
                        that.toplevel.loadSpecificationsAndManage(script.getAttribute("src"));
                    }
                    
                    break;
            }
        } 
        
        return this;
    };

    Thicket.prototype.manageSourceCode = function(content) {
        this.toplevel.manageSourceCode(content);                    
        return this;
    };

    Thicket.prototype.toplevel = function() {
        return this.toplevel;
    };

    Thicket.prototype.boot = function () {
        return this.manageScripts();
    };
    
    Thicket.prototype.whenReady = function (callback) {
        callback(this);
        return this;
    };

    return function (directory) {
        return new Thicket(directory);
    };
    
}());
