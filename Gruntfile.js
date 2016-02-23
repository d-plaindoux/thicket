'use strict';

module.exports = function(grunt) {
    
  // Project configuration.
  grunt.initConfig({
    nodeunit: {
      files: ['test/**/*_test.js'],
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: ['Gruntfile_*.js'],
      },
      src: {
        src: ['lib/**/*.js']
      },
      test: {
        src: ['test/**/*.js']
      },
    },
    exec: {
        thicket_prepare:      'mkdir build; true',
        thicket_web_lang:     './node_modules/browserify/bin/cmd.js -r ./lib/Thicket/frontend/w3repl.js:thicket    -o ./build/thicket-web-lang.js',
        thicket_web_runtime:  './node_modules/browserify/bin/cmd.js -r ./lib/Thicket/frontend/w3exec.js:thicket    -o ./build/thicket-web-runtime.js',
        thicket_core_lang:    './node_modules/browserify/bin/cmd.js -r ./lib/Thicket/frontend/interpret.js:thicket -o ./build/thicket-core-lang.js',
        thicket_core_runtime: './node_modules/browserify/bin/cmd.js -r ./lib/Thicket/frontend/runtime.js:thicket   -o ./build/thicket-core-runtime.js',
    },
    uglify: {
        options: {
            mangle: true,            
            beautify: false
        },
        my_target: {
            files: {
                './build/thicket-web-lang.min.js':    ['./build/thicket-web-lang.js'],
                './build/thicket-web-runtime.min.js': ['./build/thicket-web-runtime.js'],
                './build/thicket-core-lang.min.js':   ['./build/thicket-core-lang.js'],
                './build/thicket-core-runtime.min.js':['./build/thicket-core-runtime.js']
            }
        }
    }      
  });

  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');  
  grunt.loadNpmTasks('grunt-exec');    
  grunt.loadNpmTasks('grunt-contrib-uglify');  
    
  grunt.registerTask('package', 
                     ['jshint', 
                      'exec:thicket_prepare', 
                      'exec:thicket_web_lang', 
                      'exec:thicket_web_runtime', 
                      'exec:thicket_core_lang', 
                      'exec:thicket_core_runtime', 
                      'uglify']);
    
  grunt.registerTask('default', 
                     ['jshint', 
                      'nodeunit']);
};

