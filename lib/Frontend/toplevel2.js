/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    "use strict";
    
    var thicketc = require('../Thicket/thicketc.js'),
        codegen = require('../Thicket/generator/code2.js'),
        objcode = require('../Thicket/generator/objcode.js'),
        list = require('../Data/list.js'),
        option = require('../Data/option.js'),
        stringify = require('../Thicket/syntax/stringify.js');    

    function codeEvaluation(code, runtime) {
        return runtime.execute(code);
    }

    function moduleEvaluation(reader, runtime) {
        return function(name) {
            reader.map(function(reader) {
                reader.code(name).map(function(entity) {
                    runtime.register(entity);
                });
            });
        };
    }
    
    // ------------------------------------------------------------------------------

    function Toplevel(driver, runtime) {                
        this.reader = driver.map(function(driver) {
            return require('../Resource/reader.js')(driver);
        });
        
        this.runtime = runtime;
        this.modules = require('../Resource/modules')(option.some(moduleEvaluation(this.reader, this.runtime)));
    }

    Toplevel.prototype.manageSentence = function(allEntities, line) {
        var sentence = thicketc.sentence(allEntities, line),
            that = this;

        return sentence.map(function(sentence) {
            if (sentence.isFailure()) {
                console.log("[ERROR]" + " " + sentence.failure().message);
                return allEntities;

            } else {
                var code = codegen.sentence(list(allEntities), sentence.success().expr);

                if (code.isSuccess()) {
                    try {        
                        var binary = objcode.generateObjCode(objcode.deBruijnIndex(code.success())),
                            result = codeEvaluation(binary, that.runtime);
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
            definitionAndEntities = thicketc.source(line).flatmap(function (definitionAndEntities) {        
                that.reader.map(function(reader) {
                    newEntities = newEntities.concat(thicketc.imports(that.modules,reader,definitionAndEntities[0]));
                });

                return thicketc.entities(newEntities, definitionAndEntities[1]).map(function() {
                    return definitionAndEntities;
                });
            });

        if (definitionAndEntities.isSuccess()) {                    
            var entities = definitionAndEntities.success()[1];

            newEntities = newEntities.concat(entities);

            entities.map(function(entity) {
                codegen.entity(list(newEntities), entity).map(function(code) {
                    var binary = objcode.generateObjCode(objcode.deBruijnIndex(code));
                    that.runtime.register(binary[0]);
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
    
    return function (driver, runtime) {
        return new Toplevel(driver, runtime);
    };
    
}());
