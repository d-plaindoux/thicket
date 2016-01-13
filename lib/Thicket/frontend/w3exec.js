/*global document*/
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
    
    var option = require('../../Data/option.js');
    
    function Thicket(directory) {
        var driver = option.some(directory).map(function(directory) {
                return require('../resource/drivers/w3driver.js')(directory);
            }),
            reader = driver.map(function(driver) { 
                return require('../resource/reader.js')(driver); 
            });
        
        this.runtime = require('../runtime/runtime.js')(reader).setDebug(false);
    }
  
    Thicket.prototype.manageScripts = function() {        
        var that = this, index, script,
            scripts = document.getElementsByTagName("script");
        
        for (index = 0; index < scripts.length; index++) {
            script = scripts[index];            
            switch (script.getAttribute("type")) {
                case "application/thicket+package":
                    if (script.getAttribute("data-src")) {
                        that.runtime.loadPackage(script.getAttribute("data-src"));
                    } else {
                        that.runtime.storePackage(JSON.parse(script.innerHTML));                                        
                    }
                    
                    break;
            }
        } 
        
        for (index = 0; index < scripts.length; index++) {
            script = scripts[index];            
            switch (script.getAttribute("type")) {
                case "application/thicket+main":
                    if (script.getAttribute("data-src")) {
                        that.runtime.loadAndExecuteModule(script.getAttribute("data-src"));
                    } else {
                        that.runtime.loadAndExecuteModule(script.innerHTML);                
                    }
                    
                    break;
            }
        } 
        
        return this;
    };

    Thicket.prototype.boot = function () {
        return this.manageScripts();
    };

    return function (directory) {
        return new Thicket(directory);
    };
    
}());
