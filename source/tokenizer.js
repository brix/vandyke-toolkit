'use strict';

var Cla55 = require('cla55').create(Array),
    Token = require('./token'),
    Tokenizer;

Tokenizer = Cla55.extend({
    constructor: function constructor(content) {
        this.index = -1;
    },

    // Reference the token class
    Token: Token,

    _tokenTypes: {},

    _tokenPriority: [],

    parse: function (content) {
        var updateIndex = this.index <= -1;

        content.replace(/[^\r\n]*(?:\r?\n|\r|$)/g, this._parseLine.bind(this, {
            range: 0,
            line: 0,
            column: 0
        }));

        if (updateIndex) {
            this.index = this.length ? 0 : -1;
        }
    },

    _parseLine: function (pos, line) {
        var text = null,
            type,
            match,
            i,
            l;

        // Clear position for new line
        pos.column = 0;
        pos.line += 1;

        // Parse tokens for current line
        while (line.length) {
            for (i = 0, l = this._tokenPriority.length; i <= l; i++) {
                type = this._tokenPriority[i];

                if (i >= l) {
                    // Extend simple text
                    line = line.split('');
                    text = (text || '') + line.splice(0, 1).join('');
                    line = line.join('');
                } else if (this._tokenTypes[type].test(line)) {
                    // Handle simple text not matched by special tokens
                    if (text !== null) {
                        this._parseToken(pos, 'Text', text);
                        text = null;
                    }

                    // Handle matched token
                    line = line.replace(this._tokenTypes[type], this._parseToken.bind(this, pos, type));

                    break;
                }
            }
        }

        // Handle simple text not matched by special tokens
        if (text !== null) {
            this._parseToken(pos, 'Text', text);
            text = null;
        }

        // Splice (usage as replace method)
        return '';
    },

    _parseToken: function (pos, type, value) {
        // Increment range
        pos.range = pos.range + value.length;
        pos.column = pos.column + value.length;

        // Add token
        this.push(new this.Token(
            type,
            value,
            [
                pos.range - value.length,
                pos.range
            ],
            {
                start: {
                    line: pos.line,
                    column: pos.column - value.length
                },
                end: {
                    line: pos.line,
                    column: pos.column - 1
                }
            }
        ));

        // Splice (usage as replace method)
        return '';
    },

    // Set token index / get token by index
    token: function token(tokenInstance) {
        if (arguments.length && tokenInstance) {
            this.index = this.indexOf(tokenInstance);
        }

        return this[this.index];
    },

    prev: function prev() {
        this.index--;

        return this;
    },

    next: function next() {
        this.index++;

        return this;
    },

    findPrevEmpty: function findPrevEmpty(includeCurrent) {
        var i = this.index - (includeCurrent ? 0 : 1);

        while (this[i] && !this[i].is('Empty')) {
            i--;
        }

        this.token(this[i]);

        return this;
    },

    findNextEmpty: function findNextEmpty(includeCurrent) {
        var i = this.index + (includeCurrent ? 0 : 1);

        while (this[i] && !this[i].is('Empty')) {
            i++;
        }

        this.token(this[i]);

        return this;
    },

    findPrevNotEmpty: function findPrevNotEmpty(includeCurrent) {
        var i = this.index - (includeCurrent ? 0 : 1);

        while (this[i] && this[i].is('Empty')) {
            i--;
        }

        this.token(this[i]);

        return this;
    },

    findNextNotEmpty: function findNextNotEmpty(includeCurrent) {
        var i = this.index + (includeCurrent ? 0 : 1);

        while (this[i] && this[i].is('Empty')) {
            i++;
        }

        this.token(this[i]);

        return this;
    },

    // Export clean array of tokens
    toJSON: function toJSON() {
        return this.map(function (tokenInstance) {
            return tokenInstance.toJSON();
        });
    }
}, {
    register: function register(type, reg) {
        this.prototype._tokenTypes[type] = reg;

        if (this.prototype._tokenPriority.indexOf(type) === -1) {
            this.prototype._tokenPriority.push(type);
        }
    },

    unregister: function unregister(type) {
        var index = this.prototype._tokenPriority.indexOf(type);

        // Remove type from oder list
        this.prototype._tokenPriority.splice(index, 1);

        // Remove token type
        this.prototype._tokenTypes[type] = null;
    },

    prioritize: function (order) {
        this.prototype._tokenPriority = order;
    },

    extend: function () {
        var Child = Cla55.extend.apply(this, arguments);

        // Prevent changes on child class affects parent class
        Child.prototype._tokenTypes = Object.create(Child.prototype._tokenTypes);
        Child.prototype._tokenPriority = [].concat(Child.prototype._tokenPriority);

        return Child;
    }
});

Tokenizer.register('WhiteSpace', /^([\t ]+)/);
Tokenizer.register('LineBreak', /^(\r\n|\r|\n)/);
Tokenizer.register('String', /^((?:"(?:[^"\\\\]*|\\\\["\\\\bfnrt\/]|\\\\u[0-9a-f]{4})*"))/);
Tokenizer.register('Number', /^((?:-?(?=[1-9]|0(?!\d))\d+(?:\.\d+)?(?:[eE][+-]?\d+)?))/);
Tokenizer.register('Boolean', /^(true|false)/);
Tokenizer.register('Identifier', /^[a-z0-9\-_]+/i);
Tokenizer.register('Punctuator', (function () {
    var punctuators = ([
            '../',      // Data path parent
            '{#',       // Open helper
            '{/',       // Close helper
            '/}',       // Self closing helper
            '{:',       // Alternate helper
            '</',       // Close element
            '/>',       // Self closing element
            '{',        // Open expression
            '}',        // Close expressen
            '<',        // Open element
            '>',        // End element
            '.',        // Path separator
            '@',        // Path scope flag
            '+',        // Concat
            '='         // Attribute assign
        ]).map(function (punctuator) {
            return punctuator.replace(/([\.$?*|{}\(\)\[\]\\\/\+\^])/g, function (ch) {
                return '\\' + ch;
            });
        });

    return new RegExp('^(' + punctuators.join('|') + ')', '');
}()));

module.exports = Tokenizer;
