/*jshint -W061 */
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
                return require('../Resource/drivers/w3driver.js')(directory);
            }),
            // dom = require('../Runtime/dom.js'),
            runtime = require('../Runtime/runtime2.js');
        
        // runtime.extendWith(dom);
        
        this.allEntities = [];
        this.toplevel = require('./toplevel2.js')(driver, runtime);
        
        // Define main function
        document.ThicketRT = runtime;
    }

    Thicket.prototype.manageScripts = function() {
        var scripts = document.getElementsByTagName("script");
        
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].getAttribute("type") === "text/thicket") {
                var script = scripts[i];
                
                if (script.getAttribute("src")) {
                    this.allEntities = this.toplevel.loadAndManage(this.allEntities, script.getAttribute("src"));
                } else {
                    this.allEntities = this.toplevel.manage(this.allEntities, script.innerHTML);                
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
