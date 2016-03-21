/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';
    
    var $i = require('./instruction.js');

    function measureInstructionOverhead(runtime, instruction) {
        var t0 = Date.now();
        
        if (!runtime.measures[instruction]) {
            runtime.measures[instruction] = { 
                name: $i.toString(instruction), 
                duration: 0, 
                hits: 0 
            };
        }

        runtime.measures[instruction].duration = runtime.measures[instruction].duration + (t0 - runtime.t0);
        runtime.measures[instruction].hits = runtime.measures[instruction].hits + 1;
        runtime.t0 = Date.now();
    }
    
    function resetTimerForMeasurement(runtime) {
        runtime.t0 = Date.now();
    }
    
    function displayMeasureInstructionOverhead(t0, measures) {
        var total = Date.now() - t0, hits = 0, k;
                
        for(k in measures) {
            hits += measures[k].hits;
        }
                    
        for (k in measures) {                
            console.log("| " + 
                        measures[k].duration + " ms (" + Math.floor(100*measures[k].duration/total) +"%)\t | " +
                        measures[k].hits     + " hits (" + Math.floor(100*measures[k].hits/hits) +"%)\t | " +
                        Math.floor(10000*(measures[k].duration/(1+measures[k].hits))) + "w\t | " + measures[k].name);
        }   
                    
        console.log("| " + total + " ms\t | " + 
                    hits + " hits \t | " + 
                    Math.floor(10000*(total/(1+hits))) + "w");        
    }
    
    return {
        measureInstructionOverhead : measureInstructionOverhead,
        resetTimerForMeasurement : resetTimerForMeasurement,
        displayMeasureInstructionOverhead : displayMeasureInstructionOverhead 
    };
}());
