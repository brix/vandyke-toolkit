/*global require, exports, module*/

var Token = require('./token');

function Tokenizer(tokens) {
    if (typeof tokens === 'string') {
        return Tokenizer.parse(tokens);
    }

    this.index = 0;
};

Tokenizer.parse = function parse(content) {
    var context, range, error, i, l;

    context = new Tokenizer();
    range = 0;

    while (content.length) {
        for (i = 0, l = Tokenizer._tokenList.length; i <= l; i++) {

            if (i >= l) {
                error = 'Unxpected token' + content.substr(0, 10);
                content = '';
                break;
                throw(error);
            }

            if (Tokenizer._tokens[Tokenizer._tokenList[i]].test(content)) {
                content = content.replace(Tokenizer._tokens[Tokenizer._tokenList[i]], function (value) {
                    // Increment range
                    range = range + value.length;

                    // Add token
                    context.push(new Token(
                        context,
                        Tokenizer._tokenList[i],
                        value, [range - value.length,
                        range - 1]
                    ));

                    // Slice content
                    return '';
                });

                break;
            }
        }
    }

    return context;
};

Tokenizer._tokens = {};

Tokenizer._tokenList = [];

Tokenizer.register = function register(id, reg) {
    if (!Tokenizer._tokens[id]) {
        Tokenizer._tokens[id] = reg;
        Tokenizer._tokenList.push(id);
    }
};

Tokenizer.prototype = new Array();

Tokenizer.prototype.token = function (token) {
    if (arguments.length) {
        this.index = this.indexOf(token.token ? token.token() : token);
    }

    return this[this.index];
};

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
