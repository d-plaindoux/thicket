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
    
    function Thicket(directories) {
        var driver = option.some(directories).map(function(directories) {
                return require('../resource/drivers/w3driver.js')(directories);
            }),
            reader = driver.map(function(driver) { 
                return require('../resource/reader.js')(driver); 
            }),
            dom = require('../runtime/dom.js'),
            backend = require('../runtime/backend.js'),
            native = require('../runtime/native.js'),
            runtime = require('../runtime/runtime.js')(reader).
                        extendWith(native).
                        extendWith(dom).                        
                        extendWith(backend).
                        setDebug(false);
        
        this.directories = directories;
        this.toplevel = require('./toplevel.js')(reader, runtime, true);
    }
    
    Thicket.prototype.instance = function(directories) {
        return new Thicket(directories || this.directories);
    };
  
    Thicket.prototype.manageScripts = function() {        
        var that = this, index, script,
            scripts = document.getElementsByTagName("script");
        
        for (index = 0; index < scripts.length; index++) {
            script = scripts[index];            
            switch (script.getAttribute("type")) {
                case "application/thicket+package":
                    if (script.getAttribute("data-src")) {
                        that.toplevel.loadPackage(script.getAttribute("data-src") + ".io");
                    } else {
                        that.toplevel.loadPackage(script.innerHTML);                
                    }
                    
                    break;
            }
        } 
        
        this.toplevel.loadSpecifications("Boot.Core");
        this.toplevel.loadSpecifications("Boot.Client");

        for (index = 0; index < scripts.length; index++) {
            script = scripts[index];            
            switch (script.getAttribute("type")) {
                case "application/thicket+main":
                    if (script.getAttribute("data-src")) {
                        that.toplevel.loadObjcodeAndExecute(script.getAttribute("data-src"));
                    } else {
                        that.toplevel.loadObjcodeAndExecute(script.innerHTML);                
                    }
                    
                    break;
                    
                case "application/thicket":
                    if (script.getAttribute("data-src")) {
                        var content = that.toplevel.loadSourceCode(script.getAttribute("data-src"));
                        
                        if (content.isPresent()) {
                            that.toplevel.manageSourceCode(content.get());
                        }
                    } else {
                        that.toplevel.manageSourceCode(script.innerHTML);                
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
    
    Thicket.prototype.withExtension = function (callback) {
        callback(this);
        return this;
    };

    return function (directory) {
        return new Thicket(directory);
    };
    
}());
