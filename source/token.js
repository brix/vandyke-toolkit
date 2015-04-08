/*global require, exports, module*/

var Cla55 = require('cla55'),
    Token;

Token = Cla55.extend({
    constructor: function constructor(type, value, range, loc) {
        this.type = type;
        this.value = value;
        this.range = range;
        this.loc = loc;
    },

    hasValue: function hasValue() {
        var value,
            i,
            l;

        for (i = 0, l = arguments.length; i < l; i++) {
            value = arguments[i];
            match = value instanceof RegExp ? value.test(this.value) : this.value === value;

            if (match) {
                return true;
            }
        }

        return false;
    },

    hasNotValue: function hasNotValue() {
        return !this.hasValue.apply(this, arguments);
    },

    is: function is() {
        var notExpr = /^Not/,
            not,

            name,
            i,
            l;

        for (i = 0, l = arguments.length; i < l; i++) {
            name = arguments[i];
            not = notExpr.test(name) && (name = name.replace(notExpr, '')) && true;
            match = (this['_is' + name] && this['_is' + name]()) || this.type === name;

            if (not && !match || !not && match) {
                return true;
            }
        }

        return false;
    },

    isNot: function isNot() {
        return !this.is.apply(this, arguments);
    },

    // Special tests
    _isEmpty: function isEmpty() {
        return this.is('LineBreak') || this.is('WhiteSpace');
    },

    _isNumberIdentifier: function isNumberIdentifier() {
        return this.is('Number') && this.hasValue(/^[0-9]+$/);
    },

    toJSON: function toJSON() {
        return {
            type: this.type,
            value: this.value,
            range: this.range,
            loc: this.loc
        };
    }
});

module.exports = Token;
