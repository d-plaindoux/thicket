/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    "use strict";
    
    var analyzer = require('../compiler/analyzer.js'),
        codegen = require('../compiler/generator/code.js'),
        deBruijn = require('../compiler/generator/deBruijn.js'),
        objcode = require('../compiler/generator/objcode.js'),
        list = require('../../Data/list.js'),
        option = require('../../Data/option.js'),
        stringify = require('../compiler/syntax/stringify.js'),
        packages = require('../compiler/data/packages.js'),
        linker = require('../compiler/data/linker.js'),
        environment = require('../compiler/data/environment.js');

    function codeEvaluation(code, runtime, debug) {
        return runtime.execute(code, debug);
    }

    function moduleEvaluation(reader, runtime) {
        return function(name) {
            reader.map(function(reader) {
                var binary = reader.code(name);
                binary.objcode.map(function(entity) {
                    runtime.register(entity, binary.namespace);
                });
            });
        };
    }
    
    // ------------------------------------------------------------------------------

    function Toplevel(driver, runtime, debug) {                
        this.reader = driver.map(function(driver) {
            return require('../resource/reader.js')(driver);
        });
        
        this.debug = debug;
        this.runtime = runtime;
        this.packages = packages(option.some(moduleEvaluation(this.reader, this.runtime)));
        this.packages.defineInRoot([]);
    }

    Toplevel.prototype.displayError = function (error) {
        console.log("[ERROR]" + " - " + error.message);
        if (this.debug) {
            console.log("[STACK] " + error.stack);
        }
    };
    
    Toplevel.prototype.manageSentence = function(sentence) {
        var that = this,
            linkage = linker(this.packages).linkSentence("main", sentence);

        if (linkage.isFailure()) {
            that.displayError(linkage.failure());
            return;
        } 

        analyzer.sentence(environment(this.packages), sentence).map(function(sentence) {
            if (sentence.isFailure()) {
                that.displayError(sentence.failure());
            } else {
                var code = codegen.sentence(sentence.success().expr);

                if (code.isFailure()) {
                    that.displayError(code.failure());
                    return;
                } 
                
                try {        
                    var binary = objcode.generateObjCode(deBruijn.indexes(code.success())),
                        result = codeEvaluation(binary, that.runtime, that.debug);
                    console.log(stringify(sentence.success().type) + " :: " + that.runtime.pretty(result));
                } catch (error) {
                    console.log(stringify(sentence.success().type) + " :: <failure>");
                    that.displayError(error);
                }
            }            
        });
    };
    
    Toplevel.prototype.manage = function(line) {        
        var that = this,
            result;
        
        result = analyzer.source(line).flatmap(function (definitionEntitiesAndSentences) {        
            that.reader.map(function(reader) {
                analyzer.imports(that.packages,reader,definitionEntitiesAndSentences[0]);
                // Must be checked may be ...
            });

            that.packages.defineInRoot(definitionEntitiesAndSentences[1]); // Entities must be removed if something fails ...

            return linker(that.packages).linkEntities('main', list(definitionEntitiesAndSentences[1])).flatmap(function() {
                return analyzer.entities(environment(that.packages), definitionEntitiesAndSentences[1]).map(function(subtitutionsAndEntities) {
                    subtitutionsAndEntities.map(function(entity) {
                        codegen.entity(environment(that.packages), entity.definition).map(function(code) {
                            var binary = objcode.generateObjCode(deBruijn.indexes(code));
                            that.runtime.register(binary[0], 'main');
                        });
                    });                               
                });
            }).map(function(result) {
                definitionEntitiesAndSentences[2].forEach(function(sentence) {
                    that.manageSentence(sentence.definition);
                });

                return result;
            });
        });

        if (result.isFailure()) {                    
            that.displayError(result.failure());
            return;
        }
    };
    
    Toplevel.prototype.loadAndManage = function (name) {
        this.manage(this.reader.content(name));
    };
    
    return function (driver, runtime, debug) {
        return new Toplevel(driver, runtime, debug);
    };
    
}());
