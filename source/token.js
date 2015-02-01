/*global require, exports, module*/

var Cla55 = require('cla55').Cla55,
    Token;

Token = Cla55.extend({
    constructor: function constructor(context, type, value, range, loc) {
        this.context = context;
        this.type = type;
        this.value = value;
        this.range = range;
        this.loc = loc;
    },

    prev: function prev() {
        return this.context.token(this.context[this.context.indexOf(this) - 1]);
    },

    next: function next() {
        return this.context.token(this.context[this.context.indexOf(this) + 1]);
    },

    findPrevEmpty: function findPrevEmpty(includeCurrent) {
        var i = this.context.indexOf(this) - (includeCurrent ? 0 : 1);

        while (this.context[i] && !this.context[i].isEmpty()) {
            i--;
        }

        return this.context.token(this.context[i]);
    },

    findNextEmpty: function findNextEmpty(includeCurrent) {
        var i = this.context.indexOf(this) + (includeCurrent ? 0 : 1);

        while (this.context[i] && !this.context[i].isEmpty()) {
            i++;
        }

        return this.context.token(this.context[i]);
    },

    findPrevNotEmpty: function findPrevNotEmpty(includeCurrent) {
        var i = this.context.indexOf(this) - (includeCurrent ? 0 : 1);

        while (this.context[i] && this.context[i].isEmpty()) {
            i--;
        }

        return this.context.token(this.context[i]);
    },

    findNextNotEmpty: function findNextNotEmpty(includeCurrent) {
        var i = this.context.indexOf(this) + (includeCurrent ? 0 : 1);

        while (this.context[i] && this.context[i].isEmpty()) {
            i++;
        }

        return this.context.token(this.context[i]);
    },

    isEmpty: function isEmpty() {
        return this.type === 'LineBreak' || this.type === 'WhiteSpace';
    },

    isDataIdentifier: function isDataIdentifier() {
        return this.type === 'Word' && (/^([a-z][a-z0-9\-_]*)$/i).test(this.value);
    },

    isHelperIdentifier: function isHelperIdentifier() {
        return this.type === 'Word' && (/^([a-z][a-z0-9\-_]*)$/i).test(this.value);
    },

    isElementIdentifier: function isElementIdentifier() {
        return this.type === 'Word' && (/^([a-z][a-z0-9\-_]*)$/i).test(this.value);
    },

    isAttributeIdentifier: function isAttributeIdentifier() {
        return this.type === 'Word' && (/^([a-z][a-z0-9\-_]*)$/i).test(this.value);
    },

    isAttributeString: function isAttributeString() {
        return this.type === 'JavaScript' && (/^"/).test(this.value);
    },

    isBraceOpen: function isBraceOpen() {
        return this.type === 'Punctuator' && this.value === '{';
    },

    isBraceClose: function isBraceClose() {
        return this.type === 'Punctuator' && this.value === '}';
    },

    isHelperOpening: function isHelperOpening() {
        var prev = this.context[this.context.indexOf(this) - 1];

        return this.type === 'Punctuator' && this.value === '#' && prev && prev.isBraceOpen();
    },

    isHelperAlternate: function isHelperAlternate() {
        var prev = this.context[this.context.indexOf(this) - 1],
            next = this.context[this.context.indexOf(this) + 1];

        return this.type === 'Word' && this.value === 'else' && prev && prev.isBraceOpen();
    },

    isHelperClosing: function isHelperClosing() {
        var prev = this.context[this.context.indexOf(this) - 1],
            next = this.context[this.context.indexOf(this) + 1];

        return (this.type === 'Punctuator' && this.value === '/' && prev && prev.isBraceOpen()) ||
            (this.type === 'Punctuator' && this.value === '/' && next && next.isBraceClose());
    },

    isTextSnippet: function isTextSnippet() {
        return (
            this.type !== 'Punctuator' ||
            (
                this.type === 'Punctuator' && this.value !== '{' &&
                this.type === 'Punctuator' && this.value !== '<'
            )
        );
    },

    fromTo: function fromTo(tokenFrom, tokenTo) {
        var indexFrom = this.context.indexOf(tokenFrom),
            indexTo = this.context.indexOf(tokenTo);

        return this.context.slice(indexFrom, indexTo);
    }
});

module.exports = Token;
