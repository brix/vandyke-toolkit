'use strict';

var _ = require('lodash'),

    factoryModuleDefintion = require('fmd'),

    findRequires = require('find-requires');

module.exports = function (grunt) {

    grunt.registerMultiTask('fmd', function () {
        var done = this.async(),

            moduleExpr = new RegExp('^(' + this.data.files[0].cwd.replace(/([\.$?*|{}\(\)\[\]\\\/\+\^])/g, '\\$1') + ')(.*?)\\' + this.data.files[0].ext, ''),

            fmd = factoryModuleDefintion({
                    'target': this.target + '/',
                    'factories': ['commonjs', 'amd', 'global'],
                    'trim_whitespace': true,
                    'new_line': 'unix',
                    'quote': 'single',
                    'indent': '    '
                })
                .factory(
                    'commonjs',
                    function () {
                        return 'typeof exports === \'object\'';
                    },
                    function () {
                        return '// CommonJS\n' + this.factory() + '(require, exports, module);';
                    }
                )
                .factory(
                    'global',
                    function () {
                        return '';
                    },
                    function () {
                        return 'console && console.error(\'Unsupported module environment.\'); // jshint ignore:line';
                    }
                );

        // Prepare Factory-Module-Definition settings
        this.files.forEach(function (file) {
            var path = file.src[0],
                source = grunt.file.read(path).toString(),
                requires = findRequires(source),
                conf = {
                    depends: {
                        'require': 'require',
                        'exports': 'exports',
                        'module': 'module'
                    }
                };

            requires.forEach(function (modulePath) {
                // Skip native node js module
                if (['fs'].indexOf(modulePath) !== -1) {
                    return;
                }

                // Add dependcy
                conf.depends[modulePath] = null;

                // Define vendor library
                if (!/^\./.test(modulePath)) {
                    fmd.vendor(modulePath);
                }
            });

            fmd.define(path.replace(moduleExpr, './$2'), [path], conf);
        });

        // Build packege modules
        fmd.build(function (createdFiles) {
            done();
        });

    });

};
