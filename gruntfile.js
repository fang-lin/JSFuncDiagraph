/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

module.exports = function (grunt) {
    'use strict';

    //grunt plugins
    require('load-grunt-tasks')(grunt);
    //config
    grunt.initConfig({
        clean: ['dist', 'tmp'],

        jshint: {
            options: {
                base: '',
                jshintrc: true,
                reporter: 'test/jshintreport.js'
            },
            client: {
                files: {
                    src: ['client/*.js', 'client/app/*.js', 'client/app/**/*.js']
                }
            },
            server: {
                files: {
                    src: '*.js'
                }
            }
        },

        less: {
            all: {
                files: {
                    'client/css/main.css': 'client/css/main.less'
                }
            }
        },

        uglify: {
            options: {
                preserveComments: true
            },
            requirejs: {
                files: {
                    'dist/lib/requirejs/require.js': ['client/lib/requirejs/require.js']
                }
            }
        },

        bower: {
            install: {
                options: {
                    targetDir: 'client/lib',
                    layout: 'byComponent',
                    install: true,
                    verbose: false,
                    cleanTargetDir: true,
                    cleanBowerDir: false,
                    bowerOptions: {}
                }
            }
        },

        requirejs: {
            dist: {
                options: {
                    baseUrl: '',
                    name: 'client/init',
                    mainConfigFile: 'client/build.js',
                    out: 'dist/init.js',
                    preserveLicenseComments: false
                }
            }
        },

        cssmin: {
            combine: {
                files: {
                    'dist/css/main.css': ['client/css/main.css']
                }
            }
        },

        copy: {
            main: {
                files: [
                    {expand: true, flatten: true, src: 'client/*', dest: 'dist/', filter: 'isFile'}
                ]
            }
        },

        watch: {
            less: {
                files: [
                    'client/css/*.less'
                ],
                tasks: ['less']
            }
        },

        nodemon: {
            dev: {
                script: 'server.js',
                options: {
                    ignore: ['client/**']
                }
            }
        }
    });

    //alias tasks
    grunt.registerTask('dev-build', ['clean', 'less', 'copy', 'uglify', 'requirejs', 'cssmin']);
    grunt.registerTask('build', ['bower', 'clean', 'less', 'copy', 'uglify', 'requirejs', 'cssmin']);
};