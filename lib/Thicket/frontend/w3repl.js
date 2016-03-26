/*global document*/

/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
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
            });
        
        this.directories = directories;
        this.toplevel = require('./toplevel.js')(reader, false);
    }
    
    Thicket.prototype.externalize = function() {
        return this.toplevel.externalize(this);
    };
    
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
                        that.toplevel.loadPackage(script.getAttribute("data-src"));
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
                        that.toplevel.storeObjcodeAndExecute(JSON.parse(script.innerHTML));                
                    }
                    
                    break;
                    
                case "application/thicket":
                    if (script.getAttribute("data-src")) {
                        var content = that.toplevel.loadSourceCode(script.getAttribute("data-src"));
                        
                        if (content.isPresent()) {
                            that.toplevel.manageModuleCode(content.get());
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
    
    return function (directory) {
        return new Thicket(directory);
    };
    
}());
