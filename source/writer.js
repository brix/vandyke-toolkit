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
        var lineBreakVal = this.option('lineBreak'),
            i = 0;

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
