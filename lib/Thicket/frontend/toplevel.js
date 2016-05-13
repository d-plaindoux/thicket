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
    
    var list = require('../../Data/list.js'),
        atry = require('../../Data/atry.js'),
        analyzer = require('../compiler/analyzer.js'),
        codegen = require('../compiler/generator/code.js'),
        deBruijn = require('../compiler/generator/deBruijn.js'),
        objcode = require('../compiler/generator/objcode.js'),
        stringify = require('../compiler/syntax/stringify.js'),
        packages = require('../compiler/data/packages.js'),
        linker = require('../compiler/data/linker.js'),
        environment = require('../compiler/data/environment.js'),
        runtime = require('../runtime/runtime.js');        

    function codeEvaluation(code, runtime, debug) {
        return runtime.execute(code, debug);
    }

    // ------------------------------------------------------------------------------

    function Toplevel(reader, debug) {  
        this.logAgent = undefined;
        this.debug = debug;
        this.runtime = runtime(reader).setDebug(debug);

        this.reader = reader;
        this.packages = packages();
        
        this.packages.defineInRoot([],[]);
    }
    
    Toplevel.prototype.externalize = function(thicket) {
        this.runtime.thicket = thicket;
        return thicket;
    };

    Toplevel.prototype.setLogAgent = function(logAgent) {
        this.logAgent = logAgent;
        return this;
    };
    
    Toplevel.prototype.addExtension = function(extension) {
        // TODO -- Add authorizartion to this feature
        this.runtime.extendWith(extension);
    };
    
    Toplevel.prototype.displayError = function (error) {
        this.displayMessage("error" + " " + error.message);
        if (this.debug) {
            console.log("stack " + error.stack);
        }
    };

    Toplevel.prototype.displayMessage = function (message) {
        if (this.logAgent) {
            try {
                this.logAgent(message);
            } catch (error) {
                console.log(message);
                this.displayError(error);
            }
        } else {
            console.log(message);
        }
    };

    Toplevel.prototype.manageSentence = function(sentence) {
        var that = this,
            linkage = linker(this.packages).linkSentence(this.packages.main(), sentence);

        if (linkage.isFailure()) {
            return linkage;
        } 

        return analyzer.sentence(environment(this.packages), sentence).map(function(sentence) {
            if (sentence.isFailure()) {
                return sentence;
            }             
            
            var code = codegen.sentence(sentence.success().expr);

            if (code.isFailure()) {
                return code;
            } 

            try {        
                var binary = objcode.generateObjCode(deBruijn.indexes(code.success())),
                    result = codeEvaluation(binary, that.runtime, that.debug);

                that.displayMessage("- : " + stringify(sentence.success().type) + " = " + that.runtime.pretty(result));

                return atry.success(result);
            } catch (error) {
                that.displayMessage("- : " + stringify(sentence.success().type) + " = " + "<failure>");
                that.displayError(error);
                return atry.failure(error);
            }            
        });
    };
    
    Toplevel.prototype.manageEntities = function(entitiesAndSentences) {        
        var that = this, 
            result, 
            previousRootPackage;
        
        that.reader.map(function(reader) {
            analyzer.imports(that.packages,reader,entitiesAndSentences[0]);
        });

        previousRootPackage = that.packages.defineInRoot(entitiesAndSentences[0], entitiesAndSentences[1]); 

        result = linker(that.packages).linkEntities(that.packages.main(), list(entitiesAndSentences[1])).flatmap(function() {
            return analyzer.entities(environment(that.packages), entitiesAndSentences[1]).map(function(subtitutionsAndEntities) {
                subtitutionsAndEntities.map(function(entity) {
                    codegen.entity(environment(that.packages), entity.definition).map(function(code) {
                        var binary = objcode.generateObjCode(deBruijn.indexes(code));
                        that.runtime.register(binary[0], that.packages.main());                    
                    });
                });                               
                return subtitutionsAndEntities;
            });
        }).flatmap(function(result) {
            return list(entitiesAndSentences[2]).foldL(atry.success(result), function(result, sentence) {
                return result.flatmap(function() {
                    return that.manageSentence(sentence.definition);
                });
            });
        });

        if (result.isFailure()) {
            this.packages.restoreOrDelete(this.packages.main(), previousRootPackage);
        }
        
        return result;
    };
    
    Toplevel.prototype.manageModule = function(module) {        
        var that = this, 
            result, 
            previousRootPackage;
        
        that.reader.map(function(reader) {
            analyzer.imports(that.packages,reader,module.imports);
        });

        previousRootPackage = that.packages.define(module);

        result = linker(that.packages).linkPackageByName(module.namespace).flatmap(function() {
            return linker(that.packages).linkEntities(that.packages.main(), list(module.entities)).flatmap(function() {
                return analyzer.entities(environment(that.packages), module.entities).map(function(subtitutionsAndEntities) {
                    subtitutionsAndEntities.map(function(entity) {
                        codegen.entity(environment(that.packages), entity.definition).map(function(code) {
                            var binary = objcode.generateObjCode(deBruijn.indexes(code));
                            that.runtime.register(binary[0], module.namespace);                    
                        });
                    });                               
                    return subtitutionsAndEntities;
                });
            });
        });

        if (result.isFailure()) {
            this.packages.restoreOrDelete(module.namespace, previousRootPackage);
        }
        
        return result;
    };

    Toplevel.prototype.loadSpecifications = function (name) {
        var that = this;
                
        that.reader.map(function(reader) {
            analyzer.imports(that.packages, reader, [ { namespace:name } ]);
            that.packages.defineInRoot([ { namespace:name } ], []);
        });
    };
    
    Toplevel.prototype.loadPackage = function (name) {
        var that = this;
                
        this.reader.map(function(reader) {
            try {
                var native = reader.addPackageSpecificationAndCode(name);

                native.forEach(function(native) {
                    var code = reader.native(native);
                    eval(code)(that.runtime);
                });
            } catch (error) {
                that.displayError(error);
            }
        });
    };
    
    Toplevel.prototype.loadObjcodeAndExecute = function (name) {
        this.runtime.loadAndExecuteModule(name);
    };
    
    Toplevel.prototype.storeObjcodeAndExecute = function (content) {
        this.runtime.storeAndExecuteModule(content);
    };
    
    Toplevel.prototype.manageSourceCode = function(content) {        
        var that = this,
            result = analyzer.source(content).flatmap(function (entitiesAndSentences) {        
                return that.manageEntities(entitiesAndSentences);
            });

        result.lazyRecoverWith(function(error) {
            that.displayError(error);
        });
        
        return result;
    };
    
    Toplevel.prototype.manageModuleCode = function(content, filename) {        
        var that = this,
            result = analyzer.module(content, filename).flatmap(function (module) {        
                return that.manageModule(module);
            });

        result.lazyRecoverWith(function(error) {
            that.displayError(error);
        });
        
        return result;
    };
    
    Toplevel.prototype.loadContent = function (filename) {
        return this.reader.map(function(reader) {
            return reader.content(filename);
        });
    };
        
    return function (reader, debug) {
        return new Toplevel(reader, debug);
    };
    
}());
