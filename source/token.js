/*global require, exports, module*/

function Token(context, type, value, range, loc) {
    this.context = context;
    this.type = type;
    this.value = value;
    this.range = range;
    this.loc = loc;
};

Token.prototype = {

    prev: function () {
        return this.context.token(this.context[this.context.indexOf(this) - 1]);
    },

    next: function () {
        return this.context.token(this.context[this.context.indexOf(this) + 1]);
    },

    findNextEmpty: function (includeCurrent) {
        var i = this.context.indexOf(this) - (includeCurrent ? 0 : 1);

        while (this.context[i] && !this.context[i].isEmpty()) {
            i--;
        }

        return this.context.token(this.context[i]);
    },

    findNextEmpty: function (includeCurrent) {
        var i = this.context.indexOf(this) + (includeCurrent ? 0 : 1);

        while (this.context[i] && !this.context[i].isEmpty()) {
            i++;
        }

        return this.context.token(this.context[i]);
    },

    findNextNotEmpty: function (includeCurrent) {
        var i = this.context.indexOf(this) - (includeCurrent ? 0 : 1);

        while (this.context[i] && this.context[i].isEmpty()) {
            i--;
        }

        return this.context.token(this.context[i]);
    },

    findNextNotEmpty: function (includeCurrent) {
        var i = this.context.indexOf(this) + (includeCurrent ? 0 : 1);

        while (this.context[i] && this.context[i].isEmpty()) {
            i++;
        }

        return this.context.token(this.context[i]);
    },

    isEmpty: function () {
        return this.type === 'LineBreak' || this.type === 'WhiteSpace';
    },

    isDataIdentifier: function () {
        return this.type === 'Word' && (/^([a-z][a-z0-9\-_]*)$/i).test(this.value);
    },

    isHelperIdentifier: function () {
        return this.type === 'Word' && (/^([a-z][a-z0-9\-_]*)$/i).test(this.value);
    },

    isElementIdentifier: function () {
        return this.type === 'Word' && (/^([a-z][a-z0-9\-_]*)$/i).test(this.value);
    },

    isAttributeIdentifier: function () {
        return this.type === 'Word' && (/^([a-z][a-z0-9\-_]*)$/i).test(this.value);
    },

    isAttributeString: function () {
        return this.type === 'JavaScript' && (/^"/).test(this.value);
    },

    isBraceOpen: function () {
        return this.type === 'Punctuator' && this.value === '{';
    },

    isBraceClose: function () {
        return this.type === 'Punctuator' && this.value === '}';
    },

    isHelperOpening: function () {
        var prev = this.context[this.context.indexOf(this) - 1];

        return this.type === 'Punctuator' && this.value === '#' && prev && prev.isBraceOpen();
    },

    isHelperAlternate: function () {
        var prev = this.context[this.context.indexOf(this) - 1],
            next = this.context[this.context.indexOf(this) + 1];

        return this.type === 'Punctuator' && this.value === ':' && prev && prev.isBraceOpen() &&
            next.type === 'Word' && next.value === 'else';
    },

    isHelperClosing: function () {
        var prev = this.context[this.context.indexOf(this) - 1],
            next = this.context[this.context.indexOf(this) + 1];

        return (this.type === 'Punctuator' && this.value === '/' && prev && prev.isBraceOpen()) ||
            (this.type === 'Punctuator' && this.value === '/' && next && next.isBraceClose());
    },
    
    isTextSnippet: function () {
        return (
            this.type !== 'Punctuator' || 
            (
                this.type === 'Punctuator' && this.value !== '{' && 
                this.type === 'Punctuator' && this.value !== '<'
            )
        );
    },

    fromTo: function (tokenFrom, tokenTo) {
        var indexFrom = this.context.indexOf(tokenFrom),
            indexTo = this.context.indexOf(tokenTo);

        return this.context.slice(indexFrom, indexTo);
    }
};

module.exports = Token;
