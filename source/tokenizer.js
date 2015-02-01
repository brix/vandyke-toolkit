/*global require, exports, module*/

var Cla55 = require('cla55').cla55(Array),
    Token = require('./token'),
    Tokenizer;

Tokenizer = Cla55.extend({
    constructor: function constructor(tokens) {
        if (typeof tokens === 'string') {
            return Tokenizer.parse(tokens);
        }

        this.index = 0;
    },

    token: function token(token) {
        if (arguments.length && token) {
            this.index = this.indexOf(token.token ? token.token() : token);
        }

        return this[this.index];
    }
}, {
    parse: function parse(content) {
        var context, pos, error, i, l;

        context = new Tokenizer();
        pos = {
            range: 0,
            line: 0,
            column: 0
        };

        content.replace(/(^|\r?\n|\r)([^\r\n]*)/g, function (_, br, line) {
            // Handle line break token
            pos.range = pos.range + br.length;
            pos.column = pos.column + br.length;

            if (br) {
                context.push(new Token(
                    context,
                    'LineBreak',
                    br,
                    [
                        pos.range - br.length,
                        pos.range - 1
                    ],
                    {
                        start: {
                            line: pos.line,
                            column: pos.column - br.length
                        },
                        end: {
                            line: pos.line,
                            column: pos.column - 1
                        }
                    }
                ));
            }

            // Clear position for new line
            pos.column = 0;
            pos.line += 1;

            // Parse tokens for current line
            while (line.length) {
                for (i = 0, l = Tokenizer._tokenList.length; i <= l; i++) {

                    if (i >= l) {
                        error = 'Unxpected token' + line.substr(0, 10);
                        line = '';
                        break;
                        throw(error);
                    }

                    if (Tokenizer._tokens[Tokenizer._tokenList[i]].test(line)) {
                        line = line.replace(Tokenizer._tokens[Tokenizer._tokenList[i]], function (value) {
                            // Increment range
                            pos.range = pos.range + value.length;
                            pos.column = pos.column + value.length;

                            // Add token
                            context.push(new Token(
                                context,
                                Tokenizer._tokenList[i],
                                value,
                                [
                                    pos.range - value.length,
                                    pos.range - 1
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

                            // Slice line
                            return '';
                        });

                        break;
                    }
                }
            }
        });

        return context;
    },

    _tokens: {},

    _tokenList: [],

    register: function register(id, reg) {
        if (!this._tokens[id]) {
            this._tokens[id] = reg;
            this._tokenList.push(id);
        }
    }
});

Tokenizer.register('WhiteSpace', /^([\t ]+)/);
Tokenizer.register('LineBreak', /^(\r\n|\r|\n)/);
Tokenizer.register('JavaScript', /^((?:"(?:[^"\\\\]*|\\\\["\\\\bfnrt\/]|\\\\u[0-9a-f]{4})*")|(?:'(?:[^'\\\\]*|\\\\['\\\\bfnrt\/]|\\\\u[0-9a-f]{4})*')|(?:-?(?=[1-9]|0(?!\d))\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(?:true|false))/);
Tokenizer.register('Punctuator', /^(<|>|=|\+|\{|\}|\.|#|@|\:|\/)/);
Tokenizer.register('Word', /^([^\s<>=\+\{\}\.#@\:\/"']+)/);

/*
Tokenizer.register('String', /^((?:"(?:[^"\\\\]*|\\\\["\\\\bfnrt\/]|\\\\u[0-9a-f]{4})*")|(?:'(?:[^'\\\\]*|\\\\['\\\\bfnrt\/]|\\\\u[0-9a-f]{4})*'))/);
Tokenizer.register('Number', /^((?:-?(?=[1-9]|0(?!\d))\d+(?:\.\d+)?(?:[eE][+-]?\d+)?))/);
Tokenizer.register('Boolean', /^(true|false)/);
Tokenizer.register('Identifier', /^([a-z][a-z0-9\-_]*)/i);
Tokenizer.register('Word', /^([^\s]+)/);
*/

module.exports = Tokenizer;
