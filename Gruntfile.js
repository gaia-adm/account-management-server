'use strict';
module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        //jshint
        jshint: {
            all: ['bin/*.js', 'app.js', 'routes/*.js'], options: {
                jshintrc: true
            }
        },
        //mocha
        mochaTest: {
            tests: {
                options: {
                    reporter: 'mocha-junit-reporter',
                    //captureFile: 'unit-test-results.txt',
                    reporterOptions: {
                        mochaFile: 'test-results.xml'
                    },
                    quiet: false,
                    clearRequireCache: false
                },
                src: ['test/**/*.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerTask('test', 'mochaTest:tests');
};