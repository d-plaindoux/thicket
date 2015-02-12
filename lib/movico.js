/*jshint -W061 */
/*global document*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    var movicoc = require('./Movico/movicoc.js'),
        browser = require('./Runtime/browser.js'),
        native = require('./Runtime/native.js'),
        M = browser(native(require('./Runtime/runtime.js'))),
        allEntities = [];

    
    function compileSource(source) {
        var sentence = movicoc.sentence(allEntities, source);
                
        if (sentence.isFailure()) {                    
            if (sentence.failure().checked) {
                console.log(sentence.failure().error);
            } else {
                var newEntities = movicoc.entities(allEntities, source);
                if (newEntities.isSuccess()) {
                    allEntities = allEntities.concat(newEntities.success().map(function (entity) {                                                                
                        M.$$(eval(entity.code));
                            return entity.entity;
                    }).value);
                } else {
                    console.log(newEntities.failure());
                }
            }
        } else {
            try {
                var result = M.$$(eval(sentence.success().code));
                console.log(sentence.success().type + " :: " + M.pretty(result));
            } catch (e) {
                console.log(sentence.success().type + " :: <failure>");
                console.log(e);
            }
        }
    }
    
    function compileScripts() {
        var scripts = document.getElementsByTagName("script");
    
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].getAttribute("type") === "text/movico") {
                if (scripts[i].getAttribute("src")) {
                    // TODO 
                } else {
                    compileSource(scripts[i].innerHTML);                
                }
            }
        } 
    }

    return {
        compileSource : compileSource,
        compileScripts : compileScripts
    };
    
}());
