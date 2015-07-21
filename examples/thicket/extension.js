/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

function bootstrap(thicket) {  
    function thickerExtension(runtime) {
        runtime.native("runtime.execute", 2, function(env){
            var self = env.pop(),                
                sourceCode = runtime.constant(env.pop());

            thicket.manage(sourceCode);

            return [ {RESULT:self} ];
        });

        runtime.native("runtime.logger", 3, function(env){
            var self = env.pop(),
                string = env.pop(),
                logger = env.pop();


            thicket.toplevel.logAgent = function(s) {                                             
                runtime.execute([{RESULT:logger},
                                 {RESULT:string},
                                 {CONST:s},
                                 {APPLY:1},
                                 {APPLY:1}]);
            };

            return [ {RESULT:self} ];
        });

        runtime.native("dom.getValue", 3, function(env){
            var node = runtime.constant(env.pop()),
                aSome = env.pop(),
                aNone = env.pop();

            if (node.value) {
                return [ {RESULT:aSome},{CONST:node.value},{APPLY:1} ];
            } else {
                return [ {RESULT:aNone} ];
            }
        });
    };

    thicket.toplevel.addExtension(thickerExtension);
}