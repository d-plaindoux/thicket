/*jshint -W061 */

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    "use strict";
    
    var movicoc = require('../Movico/movicoc.js'),
        codegen = require('../Movico/generator/code.js'),
        list = require('../Data/list.js'),
        option = require('../Data/option.js'),
        stringify = require('../Movico/syntax/stringify.js');    

    function codeEvaluation(code, runtime) {        
        return runtime.$$(eval(code)(runtime));
    }

    function moduleEvaluation(reader, runtime) {
        return function(name) {
            reader.map(function(reader) {
                codeEvaluation(reader.code(name), runtime);
            });
        };
    }
    
    // ------------------------------------------------------------------------------

    function Toplevel(driver) {        
        var native = require('../Runtime/native.js'),
            browser = require('../Runtime/browser.js');

        this.reader = driver.map(function(driver) {
            return require('../Resource/reader.js')(driver);
        });
        
        this.runtime = browser(native(require('../Runtime/runtime.js')));
        this.modules = require('../Resource/modules')(option.some(moduleEvaluation(this.reader, this.runtime)));
    }

    Toplevel.prototype.manageSentence = function(allEntities, line) {
        var sentence = movicoc.sentence(allEntities, line),
            that = this;

        return sentence.map(function(sentence) {
            if (sentence.isFailure()) {
                console.log("[ERROR]" + " " + sentence.failure().message);
                return allEntities;

            } else {
                var code = codegen.sentence(list(allEntities), sentence.success().expr);

                if (code.isSuccess()) {
                    try {        
                        var result = codeEvaluation(codegen.executable(code.success()), that.runtime);
                        console.log(stringify(sentence.success().type) + " :: " + that.runtime.pretty(result));
                    } catch (e) {
                        console.log(stringify(sentence.success().type) + " :: <failure>");
                        console.log("[ERROR]" + " " + e.stack);
                    }
                } else {
                    console.log("[ERROR]" + " " + code.failure().message);
                }

                return allEntities;
            }            
        });
    };

    Toplevel.prototype.manageEntities = function(allEntities, line) {        
        var newEntities = allEntities,
            that = this,
            definitionAndEntities = movicoc.source(line).flatmap(function (definitionAndEntities) {        
                that.reader.map(function(reader) {
                    newEntities = newEntities.concat(movicoc.imports(that.modules,reader,definitionAndEntities[0]));
                });

                return movicoc.entities(newEntities, definitionAndEntities[1]).map(function() {
                    return definitionAndEntities;
                });
            });

        if (definitionAndEntities.isSuccess()) {                    
            var entities = definitionAndEntities.success()[1];

            newEntities = newEntities.concat(entities);

            entities.map(function(entity) {
                codegen.entity(list(newEntities), entity).map(function(code) {
                    codeEvaluation(codegen.executable(code), that.runtime);
                });
            });

            return newEntities;
        } else {
            console.log("[ERROR]" + " - " + definitionAndEntities.failure().message);
            return newEntities;
        }
    };
    
    Toplevel.prototype.loadAndManage = function (allEntities, name) {
        return this.manage(allEntities, this.reader.content(name));
    };

    Toplevel.prototype.manage = function(allEntities, line) {
        var that = this;
        
        return that.manageSentence(allEntities, line).orLazyElse(function() {
            return that.manageEntities(allEntities, line);
        });
    };
    
    return function (driver) {
        return new Toplevel(driver);
    };
    
}());
