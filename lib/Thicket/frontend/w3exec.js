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
            reader = driver.map(function(driver) { 
                return require('../resource/reader.js')(driver); 
            }),
            dom = require('../runtime/dom.js'),
            backend = require('../runtime/backend.js'),
            native = require('../runtime/native.js');
        
        this.runtime = require('../runtime/runtime.js')(reader).
                        extendWith(native).
                        extendWith(dom).                        
                        extendWith(backend).
                        setDebug(false);
    }
  
    Thicket.prototype.manageScripts = function() {        
        var that = this,
            scripts = document.getElementsByTagName("script");
        
        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];            
            switch (script.getAttribute("type")) {
                case "text/thicket":
                    // Dump something with the console
                    break;

                case "bin/thicket":
                    if (script.getAttribute("src")) {
                        that.runtime.loadAndExecuteModule(script.getAttribute("src"));
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
