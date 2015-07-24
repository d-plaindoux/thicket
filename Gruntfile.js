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
        thicket_lg: './node_modules/browserify/bin/cmd.js -r ./lib/Thicket/frontend/wrt.js:thicket -o ./build/thicket-lang.js',
        thicket_rt: './node_modules/browserify/bin/cmd.js -r ./lib/Thicket/runtime/runtime.js:runtime -o ./build/thicket-rt.js',
        thicket_site_prepare: 'mkdir site; true',
        thicket_site: 'find thicket/core -name *.tkt | xargs ./bin/thicketc -i site -o site -v',
        thicket_examples: 'find thicket/examples -name *.tkt | xargs ./bin/thicketc -i site -o site -v'
    },
    uglify: {
        options: {
            mangle: false,            
            beautify: true
        },
        my_target: {
            files: {
                './build/thicket-lang.min.js': ['./build/thicket-lang.js'],
                './build/thicket-rt.min.js': ['./build/thicket-rt.js']
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
  grunt.registerTask('site',    ['exec:thicket_site_prepare', 'exec:thicket_site', 'exec:thicket_examples']);
  grunt.registerTask('package', ['jshint', 'exec:thicket_prepare', 'exec:thicket_lg', 'exec:thicket_rt', 'uglify']);
  grunt.registerTask('default', ['jshint', 'nodeunit']);
};

