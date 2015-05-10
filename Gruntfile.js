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
        thicket_lg: './node_modules/browserify/bin/cmd.js -r ./lib/Frontend/wrt.js:thicket -o ./build/thicket-lang.js',
        thicket_rt: './node_modules/browserify/bin/cmd.js -r ./lib/Runtime/runtime.js:runtime -o ./build/thicket-rt.js',
        thicket_site_prepare: 'mkdir site; true',
        thicket_site: './bin/thicketc -i site/ -o site/ mvc-lib/*.mvc mvc-lib/*/*.mvc'
    },
    uglify: {
        options: {
            mangle: false
        },
        my_target: {
            files: {
                './build/thicket-lang.min.js': ['./build/thicket-lang.js']
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
  grunt.registerTask('site',    ['exec:thicket_site_prepare', 'exec:thicket_site']);
  grunt.registerTask('package', ['jshint', 'exec:thicket_prepare', 'exec:thicket_lg', 'exec:thicket_rt']);
  grunt.registerTask('default', ['jshint', 'nodeunit']);
};

