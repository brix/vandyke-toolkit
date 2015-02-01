/*global require, exports, module*/

var Cla55 = require('cla55').Cla55,
    Tokenizer = require('./tokenizer'),
    Parser;

Parser = Cla55.extend({
    parse: function parse(source) {
        this.options = {};
        this.contexts = [];

        this.tokenizer = new Tokenizer(source);

        return this.Template();
    },

    option: function option(key, val) {
        if (arguments.length === 2) {
            this.options[key] = val;
        }

        return this.options[key];
    },

    token: function token() {
        return this.tokenizer.token();
    },

    error: function error(token) {
        console.error('Unxpected token: "' + token.value + '"; Line: ' + token.loc.start.line + '"; Column: ' + token.loc.start.column);
        console.trace();
    },

    create: function create(type) {
        return {
            type: type
        };
    },

    detect: function detect() {
        var token = this.token(),

            types = ['Element', 'Helper', 'Expression', 'Data', 'String', 'JavaScript', 'Text'],

            // Typ dete
            is = {
                'Element': function () {
                    // Read next token
                    var next = token.next();

                    // Reset token walk;
                    next.prev();

                    return (
                        token.type === 'Punctuator' && token.value === '<' &&
                        (
                            (next.type === 'Punctuator' && next.value !== '/') ||
                            next.type !== 'Punctuator'
                        )
                    );
                },
                'Helper': function () {
                    // Read next token
                    var next = token.next();

                    // Reset token walk;
                    next.prev();

                    return (
                        token.type === 'Punctuator' && token.value === '{' &&
                        next.type === 'Punctuator' && next.value === '#'
                    );
                },
                'Expression': function () {
                    // Read next token
                    var next = token.next();

                    // Reset token walk;
                    next.prev();

                    return (
                        token.type === 'Punctuator' && token.value === '{' &&
                        (
                            (next.type === 'Punctuator' && next.value !== '/') ||
                            next.type !== 'Punctuator'
                        )
                    );
                },
                'String': function () {
                    return token.type === 'JavaScript' && (/^"/).test(token.value);
                },
                'JavaScript': function () {
                    return token.type === 'JavaScript';
                },
                'Data': function () {
                    if (token.type === 'Punctuator' && token.value === '@')  {
                        // Read next token
                        token = token.next();

                        // Reset token walk;
                        token.prev();
                    }

                    return token.type === 'Word' && (/^([a-z][a-z0-9\-_]*)$/i).test(token.value);
                },
                'Text': function () {
                    return (
                        token.type !== 'Punctuator' ||
                        (
                            token.type === 'Punctuator' && token.value !== '{' &&
                            token.type === 'Punctuator' && token.value !== '<'
                        )
                    );
                }
            },

            // Array of accepted types give by arguments
            accept = Array.prototype.slice.call(arguments, 0),

            // Loop variables
            i, l, type;

        for (i = 0, l = types.length; i < l; i++) {
            type = types[i];
            if (accept.indexOf(type) !== -1 && is[type]()) {
                return this[type]();
            }
        }

        return null;
    },

    Identifier: function Identifier() {
        var node = this.create('Identifier'),
            token = this.token();

        node.name = token.value;

        // Next after Identifier
        this.token().next();

        return node;
    },

    String: function String() {
        var node = this.create('String'),
            token = this.token();

        node.value = token.value;

        // Next after String
        this.token().next();

        return node;
    },

    JavaScript: function JavaScript() {
        var node = this.create('JavaScript'),
            token = this.token();

        node.value = token.value;

        // Next after JavaScript
        this.token().next();

        return node;
    },

    Data: function Data() {
        var node = this.create('Data'),
            token = this.token(),
            scope = false;

        if (token.type === 'Punctuator' && token.value === '@') {
            token = token.next();

            scope = true;
        }

        if (token.type !== 'Word' || !(/^([a-z][a-z0-9\-_]*)$/i).test(token.value)) {
            return this.error(token);
        }

        node.name = this.Identifier();
        node.scope = scope;

        return node;
    },

    Template: function Template() {
        var node = this.create('Template'),
            token = this.token().findNextNotEmpty(true);

        node.element = this.detect('Element');

        return node;
    },

    Element: function Element(token) {
        var node = this.create('Element'),
            token = this.token();

        if (token.type !== 'Punctuator' && token.value !== '<') {
            return this.error(token);
        }

        // Next not empty after element opening
        token = this.token().findNextNotEmpty();

        if (token.isElementIdentifier()) {
            node.elementOpening = this.create('ElementOpening');
            node.elementOpening.name = this.Identifier();
        } else {
            return this.error(token);
        }

        node.elementOpening.attributes = this.Attributes();

        // Read current token
        token = this.token();

        if (token.type === 'Punctuator' && token.value === '/') {
            node.elementOpening.selfClosing = true;

            // Next after self closing
            token = this.token().next();
        }

        if (token.type === 'Punctuator' && token.value === '>') {
            // Next after element closing
            token = this.token().next();
        } else {
            return this.error(token);
        }

        // Skip body if self closing
        if (node.elementOpening.selfClosing) {
            return node;
        }

        node.body = this.Block();

        // Next not empty
        token = this.token().findNextNotEmpty(true);

        if (token.type !== 'Punctuator' && token.value !== '<') {
            return this.error(token);
        }

        // Next after element closing
        token = this.token().next();

        if (token.type !== 'Punctuator' && token.value !== '/') {
            return this.error(token);
        }

        // Next after not empty
        token = this.token().findNextNotEmpty();

        // Closing part of element
        if (token.isElementIdentifier() && token.value === node.elementOpening.name.name) {
            node.elementClosing = this.create('ElementClosing');
            node.elementClosing.name = this.Identifier();
        } else {
            return this.error(token);
        }

        // Next after not empty
        token = this.token().findNextNotEmpty(true);

        if (token.type === 'Punctuator' && token.value === '>') {
            // Next after element end
            token = this.token().next();
        } else {
            return this.error(token);
        }


        return node;
    },

    Attributes: function Attributes() {
        var list = [],
            node;

        this.option('.attribute', true);

        while (list) {
            node = this.Attribute();

            if (node) {
                list.push(node);
            } else {
                break;
            }
        }

        this.option('.attribute', false);

        return list;
    },

    Attribute: function Attribute() {
        var node = this.create('Property'),
            token = this.token();

        if (!token.isEmpty()) {
            return;
        }

        token = token.findNextNotEmpty();

        if (!token.isAttributeIdentifier()) {
            return;
        }

        node.name = this.Identifier();

        token = token.next();

        if (token.type === 'Punctuator' && token.value === '=') {
            token = token.next();

            node.value = this.detect('Expression', 'String');

            if (!node.value) {
                return this.error(token);
            }
        } else {
            node.value = null;
        }

        return node;
    },

    // '{ expression [+ expression] }'
    Expression: function Expression() {
        var node = this.create('Expression'),
            token = this.token();

        // Expect open brace
        if (!token.isBraceOpen()) {
            return this.error(token);
        }

        token = this.token().next();

        if (token.type === 'Punctuator' && token.value === '#') {
            token = this.token().prev();

            node.expression = this.Helper();

            token = this.token().prev();
        } else {
            node.expression = this.Concat();
        }

        token = this.token().findNextNotEmpty(true);

        if (!token.isBraceClose()) {
            return this.error(token);
        }

        token.next();

        return node;
    },

    Helper: function Helper() {
        var node = this.create('Helper'),
            token = this.token(),
            argument;

        // Expect open brace
        if (!token.isBraceOpen()) {
            return this.error(token);
        }

        token = this.token().next();

        // Expect helper declaration char
        if (token.type !== 'Punctuator' || token.value !== '#') {
            return this.error(token);
        }

        token = this.token().next();

        if (!token.isHelperIdentifier()) {
            return this.error(token);
        }

        node.helperOpening = this.create('HelperOpening');
        node.helperOpening.name = this.Identifier();

        // Not empty after Identifier
        token = this.token().findNextNotEmpty(true);

        if (token.isHelperClosing()) {
            // Helper without argument and self closing
            node.helperOpening.arguments = [];
        } else if (token.isBraceClose()) {
            // Helper without argument
            node.helperOpening.arguments = [];
        } else {
            argument = this.detect('Data', 'JavaScript');

            if (!argument) {
                return this.error(token);
            }

            node.helperOpening.arguments = [argument];

            token = this.token().findNextNotEmpty(true);
        }

        // Self closing helper (no block helper)
        if (token.isHelperClosing()) {
            node.helperOpening.selfClosing = true;

            // Next after self closing slash
            token = this.token().next();
        }

        // Expect close brace
        if (!token.isBraceClose()) {
            return this.error(token);
        }

        // Next after closing brace
        token = this.token().next();

        // Skip body if self closing
        if (node.helperOpening.selfClosing) {
            node.body = null;
            node.helperAlternate = null;
            node.helperClosing = null;

            return node;
        }

        // Use expression only on attribute context
        if (this.option('.attribute')) {
            node.body = this.Concat();
        } else {
            node.body = this.ListBlock();
        }

        // Read current token
        token = this.token();

        // Expect open brace
        if (!token.isBraceOpen()) {
            return this.error(token);
        }

        // Next after open brace
        token = this.token().next();

        if (token.isHelperAlternate()) {
            node.helperAlternate = this.create('HelperAlternate');
            node.helperAlternate.name = this.Identifier();

            // Read current token
            token = this.token();

            // Expect close brace
            if (!token.isBraceClose()) {
                return this.error(token);
            }

            // Next after else closing brace
            token = this.token().next();

            // Use expression only on attribute context
            if (this.option('.attribute')) {
                node.helperAlternate.body = this.Concat();
            } else {
                node.helperAlternate.body = this.ListBlock();
            }

            // Read current token
            token = this.token();

            if (!token.isBraceOpen()) {
                return this.error(token);
            }

            // Next after open brace
            token = this.token().next();
        } else {
            node.helperAlternate = null;
        }

        // Read current token
        token = this.token();

        if (token.isHelperClosing()) {
            token = this.token().next();

            // Expect match of closing helper identifier
            if (!token.isHelperIdentifier() || token.value !== node.helperOpening.name.name) {
                return this.error(token);
            }

            node.helperClosing = this.create('HelperClosing');
            node.helperClosing.name = this.Identifier();

            // Read current token
            token = this.token();

            // Expect close brace
            if (!token.isBraceClose()) {
                return this.error(token);
            }

            // Next after closing brace
            token = this.token().next();

            return node;
        } else {
            return this.error(this.token());
        }

        return node;
    },

    Text: function Text() {
        var node = this.create('Text'),
            token = this.token();

        if (!token.isTextSnippet()) {
            return this.error(token);
        }

        node.value = '';

        while (node) {
            if (token.isTextSnippet()) {
                node.value += token.value;
            } else {
                break;
            }

            // Next after Text
            token = this.token().next();
        }

        return node;
    },

    Concat: function Concat() {
        var node = this.create('Concat'),
            token = this.token().findNextNotEmpty(true),
            childNode;

        node.concat = [];

        while (node.concat) {
            childNode = this.detect('JavaScript', 'Data', 'Helper');

            if (childNode) {
                node.concat.push(childNode);
            } else {
                break;
            }

            token = this.token().findNextNotEmpty(true);

            if (token.type === 'Punctuator' && token.value === '+') {
                token = this.token().findNextNotEmpty();
            } else {
                break;
            }
        }

        // Return null
        if (node.concat.length === 0) {
            return null;
        }

        // Return first list item only one exists
        if (node.concat.length === 1) {
            return node.concat[0];
        }

        // Return the concat node with its list
        return node;
    },

    ListBlock: function ListBlock() {
        var node = this.create('ListBlock'),
            token = this.token().findNextNotEmpty(true),
            childNode;

        node.list = [];

        while (node.list) {
            childNode = this.detect('Element', 'Expression', 'Text');

            if (childNode) {
                node.list.push(childNode);
            } else {
                break;
            }

            token = this.token().findNextNotEmpty(true);
        }

        // Return null
        if (node.list.length === 0) {
            return null;
        }

        // Return first list item only one exists
        if (node.list.length === 1) {
            return node.list[0];
        }

        return node;
    },

    Block: function Block() {
        var node = this.create('Block'),
            token = this.token().findNextNotEmpty(true),
            childNode;

        node.body = [];

        while (node.body) {
            childNode = this.detect('Element', 'Expression', 'Text');
            if (childNode) {
                node.body.push(childNode);
            } else {
                break;
            }

            token = this.token().findNextNotEmpty(true);
        }

        return node;
    }
}, {
    parse: function parse(source) {
        return new this().parse(source);
    }
});

module.exports = Parser;
