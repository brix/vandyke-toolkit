/*jslint stupid: true*/

'use strict';

var file = require('grunt').file,

    camelize = function camelize(str) {
        return str
            .replace(/(?:(?:^\w|\-)|[A-Z]|\b\w)/g, function (letter, index) {
                return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
            })
            .replace(/[\s_\-]+/g, '');
    };

module.exports = {
    getTemplates: function () {
        var templates = {};

        file.expand({cwd: __dirname + '/'}, '*.vandyke')
            .forEach(function (filename) {
                var name = camelize(filename.replace(/\.vandyke$/, ''));

                templates[name] = {
                    filename: filename,
                    source: file.read(__dirname + '/' + filename),
                    expect: require('./' + filename.replace(/\.vandyke$/, '.expect.js'))
                };
            });

        return templates;
    }
};
