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
        movico_prepare: 'mkdir build; true',
        movico_lg: './node_modules/browserify/bin/cmd.js -r ./lib/Frontend/wrt.js:movico -o ./build/movico-lang.js',
        movico_rt: './node_modules/browserify/bin/cmd.js -r ./lib/Runtime/runtime.js:runtime -o ./build/movico-rt.js',
        movico_site_prepare: 'mkdir build; true',
        movico_site: './bin/movicoc -i site/ -o site/ mvc-lib/*.mvc mvc-lib/*/*.mvc'
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
  grunt.registerTask('site',    ['exec:movico_site_prepare', 'exec:movico_site']);
  grunt.registerTask('package', ['jshint', 'exec:movico_prepare', 'exec:movico_lg', 'exec:movico_rt']);
  grunt.registerTask('default', ['jshint', 'nodeunit']);
};

