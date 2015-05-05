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
        movico_lg: './node_modules/browserify/bin/cmd.js -r ./lib/Frontend/wrt.js:movico -o ./build/movico-lang.js',
        movico_rt: './node_modules/browserify/bin/cmd.js -r ./lib/Runtime/runtime.js:runtime -o ./build/movico-rt.js'
    },
    uglify: {
        options: {
            mangle: false
        },
        my_target: {
            files: {
                './build/movico-lang.min.js': ['./build/movico-lang.js']
            }
        }
    }      
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');  
  grunt.loadNpmTasks('grunt-exec');    
  grunt.loadNpmTasks('grunt-contrib-uglify');  
    
  // Tasks
  grunt.registerTask('package', ['jshint', 'exec:movico_lg', 'exec:movico_rt']);
  grunt.registerTask('default', ['jshint', 'nodeunit']);
};

