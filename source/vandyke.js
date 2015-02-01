/*global require, exports, module*/

var Cla55 = require('cla55').Cla55,

    Composer = require('./composer'),
    Parser = require('./parser'),
    Token = require('./token'),
    Tokenizer = require('./tokenizer'),
    Traverser = require('./traverser');

module.exports = Cla55.extend({}, {
    Composer: Composer,
    Parser: Parser,
    Token: Token,
    Tokenizer: Tokenizer,
    Traverser: Traverser
});
