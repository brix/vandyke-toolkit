;(function (root, factory) {
    if (typeof exports === 'object') {
        // CommonJS
        factory(require, exports, module);
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['require', 'exports', 'module', 'cla55'], factory);
    } else {
        console && console.error('Unsupported module environment.'); // jshint ignore:line
    }
}(this, function (require, exports, module) {

    'use strict';

    var Cla55 = require('cla55'),
        Writer;

    Writer = Cla55.extend({
        constructor: function constructor(options) {
            if (!options) {
                options = {};
            }

            this.options = {
                indent: options.indent || '    ',
                lineBreak: options.lineBreak || '\n'
            };

            this._content = '';
            this._indent = 0;
        },

        option: function options(key, val) {
            if (arguments.length === 2) {
                this.options[key] = val;
            }

            return this.options[key];
        },

        read: function () {
            return this._content;
        },

        wrap: function (before, after) {
            this._content = before + this._content + after;
        },

        write: function write(chunk) {
            var lineBreak = this.option('lineBreak'),
                i = 0;

            // Generate indent only for new line
            if (this._content.substr(this._content.length - lineBreak.length, lineBreak.length) === lineBreak) {
                while (i < this._indent) {
                    this._content += this.option('indent');
                    i++;
                }
            }

            this._content += chunk;

            return this;
        },

        writeString: function writeString(chunk) {
            return this.write(JSON.stringify(chunk.toString()));
        },

        lineBreak: function lineBreak() {
            var lineBreakVal = this.option('lineBreak');

            // Prevent double line breaks
            if (this._content.substr(this._content.length - lineBreakVal.length, lineBreakVal.length) === lineBreakVal) {
                return this;
            }

            this._content += this.option('lineBreak');

            return this;
        },

        indentInc: function indentInc() {
            this._indent++;

            return this;
        },

        indentDec: function indentDec() {
            this._indent--;

            return this;
        }
    }, {});

    module.exports = Writer;

}));