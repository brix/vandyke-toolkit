/*global require, exports, module*/

var VanDyke = require('vandyke'),

    Composer = require('./composer'),

    Parser = require('./parser'),

    Register = require('./register'),

    Token = require('./token'),

    Tokenizer = require('./tokenizer'),

    Traverser = require('./traverser'),

    Writer = require('./writer'),

    VanDykeToolkit;

VanDykeToolkit = VanDyke.Runtime.extend({}, {
    // Runtime classes
    Runtime: VanDyke.Runtime,
    Mixin: VanDyke.Mixin,

    // Runtime shortcuts
    mixin: VanDyke.mixin,

    // Toolkit classes
    Composer: Composer,
    Parser: Parser,
    Register: Register,
    Token: Token,
    Tokenizer: Tokenizer,
    Traverser: Traverser,
    Writer: Writer,

    // Toolkit shortcuts
    install: function (options) {
        console.log(this)

        var register = new this.Register(options);

        register.install();
    }
});

module.exports = VanDykeToolkit;
