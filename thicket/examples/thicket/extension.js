/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

function extension(thicket) {  
    function thicketExtension(runtime) {
        
        var $i = runtime.instruction;
        
        runtime.native("runtime.execute", 2, function(env){
            var self = env.pop(),                
                sourceCode = runtime.constant(env.pop());

            thicket.manageSourceCode(sourceCode);

            return [[ $i.RESULT, self ]];
        });

        runtime.native("runtime.logger", 3, function(env){
            var self = env.pop(),
                string = env.pop(),
                logger = env.pop();


            thicket.toplevel.setLogAgent(function(s) {                                             
                runtime.execute([[ $i.RESULT, logger ],
                                 [ $i.RESULT, string ],
                                 [ $i.CONST, s ],
                                 [ $i.APPLY ],
                                 [ $i.APPLY ]]);
            });

            return [[ $i.RESULT, self ]];
        });
    };

    thicket.toplevel.addExtension(thicketExtension);
}