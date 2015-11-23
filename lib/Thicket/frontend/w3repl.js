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
        
        this.toplevel.loadSpecifications("Boot.Core");
        this.toplevel.loadSpecifications("Boot.Client");
    }
    
    Thicket.prototype.instance = function(directories) {
        return new Thicket(directories || this.directories);
    };
  
    Thicket.prototype.manageScripts = function() {        
        var that = this,
            scripts = document.getElementsByTagName("script");
        
        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];            
            switch (script.getAttribute("type")) {
                case "application/thicket":
                    if (script.getAttribute("src")) {
                        var content = that.toplevel.loadSourceCode(script.getAttribute("src"));
                        
                        if (content.isPresent()) {
                            that.toplevel.manageSourceCode(content.get());
                        }
                    } else {
                        that.toplevel.manageSourceCode(script.innerHTML);                
                    }
                    
                    break;

                case "application/thicket+bin":
                    if (script.getAttribute("src")) {
                        that.toplevel.loadObjcodeAndExecute(script.getAttribute("src"));
                    }
                    
                    break;

                case "application/thicket+package":
                    if (script.getAttribute("src")) {
                        that.toplevel.loadObjcodeAndExecute(script.getAttribute("src"));
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
