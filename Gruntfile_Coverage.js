'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    nodeunit: {
      files: ['test/**/*_test.js'],
      options: {
        reporter: 'lcov',
        reporterOutput:'lib_cov/report'
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:src', 'nodeunit']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'nodeunit']
      },
    },
    jscoverage: {
        src: {
            expand: true,
            cwd: 'lib/',
            src: ['**/*.js'],
            dest: 'lib_cov/',
            ext: '.js',
        },
        options: {
            // custom options
        }
    },      
    env: {
        add: {
            MOVICO_COV: '_cov'
        },
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');  
  grunt.loadNpmTasks("grunt-jscoverage");
  grunt.loadNpmTasks('grunt-env');    
  
  // Tasks
  grunt.registerTask('default', ['jscoverage', 'env', 'nodeunit']);
};
