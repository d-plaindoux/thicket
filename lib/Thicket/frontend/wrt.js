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
    
    var option = require('../Data/option.js');
    
    function Thicket(directory) {
        var driver = option.some(directory).map(function(directory) {
                return require('../Thicket/resource/drivers/w3driver.js')(directory);
            }),
            dom = require('../Thicket/runtime/dom.js'),
            native = require('../Thicket/runtime/native.js'),
            runtime = require('../Thicket/runtime/runtime.js').extendWith(native).extendWith(dom).setDebug(false);
        
        this.toplevel = require('./toplevel.js')(driver, runtime, true);
        
        // Define main function for execution reentrance
        document.ThicketRT = runtime;
    }

    Thicket.prototype.manageScripts = function() {
        var scripts = document.getElementsByTagName("script");
        
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].getAttribute("type") === "text/thicket") {
                var script = scripts[i];
                
                if (script.getAttribute("src")) {
                    // TODO - Validate this portion of code
                    this.toplevel.loadAndManage(script.getAttribute("src"));
                } else {
                    this.toplevel.manage(script.innerHTML);                
                }
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
