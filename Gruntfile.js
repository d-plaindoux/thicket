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
        thicket_prepare: 'mkdir build; true',
        thicket_lang: './node_modules/browserify/bin/cmd.js -r ./lib/Thicket/frontend/w3repl.js:thicket -o ./build/thicket-lang.js',
        thicket_exec: './node_modules/browserify/bin/cmd.js -r ./lib/Thicket/frontend/w3exec.js:runtime -o ./build/thicket-exec.js',
        thicket_site_prepare: 'mkdir site; true',
        thicket_site: 'find thicket/core -name *.tkt | xargs ./bin/thicket compile -o site -v',
        thicket_examples: 'find thicket/examples -name *.tkt | xargs ./bin/thicket compile -o site -v',
        thicket_benchmarks: 'find thicket/benchmarks -name *.tkt | xargs ./bin/thicket compile -o site -v'
    },
    uglify: {
        options: {
            mangle: false,            
            beautify: true
        },
        my_target: {
            files: {
                './build/thicket-lang.min.js': ['./build/thicket-lang.js'],
                './build/thicket-exec.min.js': ['./build/thicket-exec.js']
            }
        }
    }      
  });

  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');  
  grunt.loadNpmTasks('grunt-exec');    
  grunt.loadNpmTasks('grunt-contrib-uglify');  
    
  grunt.registerTask('site',    
                     ['exec:thicket_site_prepare', 
                      'exec:thicket_site', 
                      'exec:thicket_examples', 
                      'exec:thicket_benchmarks']);
    
  grunt.registerTask('package', 
                     ['jshint', 
                      'exec:thicket_prepare', 
                      'exec:thicket_lang', 
                      'exec:thicket_exec', 
                      'uglify']);
    
  grunt.registerTask('default', 
                     ['jshint', 
                      'nodeunit']);
};

