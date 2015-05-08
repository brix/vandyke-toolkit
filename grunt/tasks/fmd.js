'use strict';

var factoryModuleDefintion = require('fmd'),

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
                        var mod = this.getModule(),
                            depends = [];

                        // Compose dependencies
                        depends = mod.require
                            .filter(function (req, i) {
                                return mod.arguments[i];
                            })
                            .map(function (req) {
                                return ['require', 'exports', 'module'].indexOf(req) > -1 ? req : 'null';
                            });

                        return '// CommonJS\n' + this.factory() + '(' + depends.join(', ') + ');';
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
                reqs = findRequires(source),
                conf = {
                    depends: {
                        'module': 'module',
                        'exports': 'exports',
                        'require': 'require'
                    }
                };

            reqs.forEach(function (modulePath) {
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
        fmd.build(function () {
            done();
        });

    });

};
