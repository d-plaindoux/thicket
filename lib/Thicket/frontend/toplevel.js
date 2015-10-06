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
        atry = require('../../Data/atry.js'),
        stringify = require('../compiler/syntax/stringify.js'),
        packages = require('../compiler/data/packages.js'),
        linker = require('../compiler/data/linker.js'),
        environment = require('../compiler/data/environment.js');

    function codeEvaluation(code, runtime, debug) {
        return runtime.execute(code, debug);
    }

    // ------------------------------------------------------------------------------

    function Toplevel(reader, runtime, debug) {  
        this.logAgent = undefined;
        this.debug = debug;
        this.runtime = runtime;

        this.reader = reader;
        this.packages = packages();
        
        this.packages.defineInRoot([],[]);
    }

    Toplevel.prototype.setLogAgent = function(logAgent) {
        this.logAgent = logAgent;
        return this;
    };
    
    Toplevel.prototype.addExtension = function(extension) {
        // TODO -- Add authorizartion to this feature
        this.runtime.extendWith(extension);
    };
    
    Toplevel.prototype.displayError = function (error) {
        this.displayMessage("[ERROR]" + " - " + error.message);
        if (this.debug) {
            console.log("[STACK] " + error.stack);
        }
    };

    Toplevel.prototype.displayMessage = function (message) {
        if (this.logAgent) {
            try {
                this.logAgent(message);
            } catch (e) {
            }
        } else {
            console.log(message);
        }
    };

    Toplevel.prototype.manageSentence = function(sentence) {
        var that = this,
            linkage = linker(this.packages).linkSentence(this.packages.main(), sentence);

        if (linkage.isFailure()) {
            that.displayError(linkage.failure());
            return linkage;
        } 

        return analyzer.sentence(environment(this.packages), sentence).map(function(sentence) {
            if (sentence.isFailure()) {
                that.displayError(sentence.failure());
                return sentence;
            }             
            
            var code = codegen.sentence(sentence.success().expr);

            if (code.isFailure()) {
                that.displayError(code.failure());
                return code;
            } 

            try {        
                var binary = objcode.generateObjCode(deBruijn.indexes(code.success())),
                    result = codeEvaluation(binary, that.runtime, that.debug);

                that.displayMessage(stringify(sentence.success().type) + " :: " + that.runtime.pretty(result));

                return atry.success(result);
            } catch (error) {
                that.displayMessage(stringify(sentence.success().type) + " :: <failure>");
                that.displayError(error);

                return atry.failure(error);
            }            
        });
    };
    
    Toplevel.prototype.manageEntities = function(definitionEntitiesAndSentences) {        
        var that = this, 
            result, 
            previousRootPackage;
        
        that.reader.map(function(reader) {
            analyzer.imports(that.packages,reader,definitionEntitiesAndSentences[0]);
        });

        previousRootPackage = that.packages.defineInRoot(definitionEntitiesAndSentences[0],
                                                         definitionEntitiesAndSentences[1]); 

        result = linker(that.packages).linkEntities(that.packages.main(), list(definitionEntitiesAndSentences[1])).flatmap(function() {
            return analyzer.entities(environment(that.packages), definitionEntitiesAndSentences[1]).map(function(subtitutionsAndEntities) {
                subtitutionsAndEntities.map(function(entity) {
                    codegen.entity(environment(that.packages), entity.definition).map(function(code) {
                        var binary = objcode.generateObjCode(deBruijn.indexes(code));
                        that.runtime.register(binary[0], that.packages.main());
                    });
                });                               
                return subtitutionsAndEntities;
            });
        }).flatmap(function(result) {
            return list(definitionEntitiesAndSentences[2]).foldL(atry.success(result), function(result, sentence) {
                return result.flatmap(function() {
                    return that.manageSentence(sentence.definition);
                });
            });
        });
      
        result.lazyRecoverWith(function(error) {
            that.packages.restore(previousRootPackage);
        });
        
        return result;
    };

    Toplevel.prototype.loadSpecifications = function (name) {
        var that = this;
                
        that.reader.map(function(reader) {
            analyzer.imports(that.packages, reader, [ { namespace:name } ]);
            that.packages.defineInRoot([ { namespace:name } ], []);
        });
    };
    
    Toplevel.prototype.loadObjcodeAndExecute = function (name) {
        this.runtime.loadAndExecuteModule(name);
    };
    
    Toplevel.prototype.manageSourceCode = function(content) {        
        var that = this,
            result = analyzer.source(content).flatmap(function (definitionEntitiesAndSentences) {        
                return that.manageEntities(definitionEntitiesAndSentences);
            });

        result.lazyRecoverWith(function(error) {
            that.displayError(error);
        });
        
        return result;
    };
    
    Toplevel.prototype.loadSourceCode = function (filename) {
        this.reader.map(function(reader) {
            return reader.content(filename);
        });
    };
    
    return function (driver, runtime, debug) {
        return new Toplevel(driver, runtime, debug);
    };
    
}());
