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
        M = browser(native(require('./Runtime/runtime.js')));

    var Movico = function() {
        this.allEntities = [];
        this.allSources = [];
    };
    
    function compileSource(self, source) {
        var sentence = movicoc.sentence(self.allEntities, source);
                
        if (sentence.isFailure()) {                    
            if (sentence.failure().checked) {
                console.log(sentence.failure().error);
            } else {
                var newEntities = movicoc.entities(self.allEntities, source);
                if (newEntities.isSuccess()) {
                    self.allEntities = self.allEntities.concat(newEntities.success().map(function (entity) {                                                                
                        M.$$(eval(entity.code));
                        return entity.entity;
                    }).value);
                } else {
                    console.log(newEntities.failure());
                }
            }
        } else {
            self.allSources = self.allSources.concat(sentence.success());
        }
    }
    
    Movico.prototype.compile = function() {
        var scripts = document.getElementsByTagName("script");
    
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].getAttribute("type") === "text/movico") {
                if (scripts[i].getAttribute("src")) {
                    // TODO 
                } else {
                    compileSource(this, scripts[i].innerHTML);                
                }
            }
        } 
        
        return this;
    };

    Movico.prototype.execute = function() {
        this.allSources.forEach(function (source) {
            try {
                var result = M.$$(eval(source.code));
                console.log(source.type + " :: " + M.pretty(result));
            } catch (e) {
                console.log(source.type + " :: <failure>");
                console.log(e);
            }            
        });
        
        this.allSources = [];
        
        return this;
    };

    return new Movico();
    
}());
