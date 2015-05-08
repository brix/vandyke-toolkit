/*jshint node: true*/

'use strict';

var path = require('path');

module.exports = function (grunt) {

    // Load all grunt tasks from node_modules, and config from /grunt/config
    require('load-grunt-config')(grunt, {
        configPath: path.join(process.cwd(), 'grunt/config'),
        config: {
            pkg: grunt.file.readJSON('package.json'),
            meta: {
                cwd: '',
                cwdAll: '**/*',

                source: 'source/',
                sourceAll: 'source/**/*',

                build: 'build/',
                buildAll: 'build/**/*',

                test: 'test/',
                testAll: 'test/**/*',

                npm: 'node_modules/',
                npmAll: 'node_modules/**/*'
            }
        }
    });

    // Will load the custom tasks
    grunt.loadTasks('./grunt/tasks');

    grunt.registerTask('build', 'Build a bundle', [
        'clean:build',
        'fmd:build',
        'copy:build',
        'update_json:npm',
        'update_json:bower',
        'jsonlint:build',
        'jshint:build'
    ]);

    grunt.registerTask('default', 'Run code checker', [
        'jsonlint:dev',
        'jshint:dev',
        'jscs:dev',
        'mochaTest:test'
    ]);

};
