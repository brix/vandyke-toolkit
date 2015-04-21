;(function (root, factory) {
    if (typeof exports === 'object') {
        // CommonJS
        factory(require, exports, module);
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['module', 'exports', 'require', 'cla55', './composer', './parser'], factory);
    } else {
        console && console.error('Unsupported module environment.'); // jshint ignore:line
    }
}(this, function (module, exports, require) {

    'use strict';

    var Cla55 = require('cla55'),

        Composer = require('./composer'),

        Parser = require('./parser'),

        Register,

        installed;

    Register = Cla55.extend({
        constructor: function (options) {
            this.options = options || {};
        },

        // Reference classes
        Parser: Parser,

        Composer: Composer,

        // Install the require extension
        install: function () {
            if (require.extensions) {
                var extensions = this.options.extensions || ['.vandyke', '.vd'];

                // Do not install twice
                if (installed) {
                    return;
                }

                // Ensure array if only one extension is set
                if (typeof extensions === 'string') {
                    extensions = [extensions];
                }

                // Set the require extension hook for all  specified extensions
                extensions.forEach(function (ext) {
                    require.extensions[ext] = this.transform.bind(this);
                }, this);

                // Notice it's installed
                installed = true;
            } else {
                throw new Error('Require extensions is not supported in this environment.');
            }
        },

        transform: function (module, filename) {
            var fs = require('fs'),

                source = fs.readFileSync(filename, {
                    encoding: 'utf8'
                }),

                ast,

                code;

            try {
                ast = this.Parser.parse(source);
                code = '\'use strict\';\n\nmodule.exports = ' + this.Composer.compose(ast);
            } catch (error) {
                throw new Error('Error transforming ' + filename + ' to VanDyke: ' + error.toString());
            }

            module._compile(code, filename);
        }
    });

    module.exports = Register;

}));