/*global require, exports, module*/

var Tokenizer = require('./tokenizer');

function Parser(content) {
    this.tokenizer = new Tokenizer(content);
    this.options = {};

    return this.Template();
};

Parser.prototype = {

    option: function (key, val) {
        if (arguments.length === 2) {
            this.options[key] = val;
        }

        return this.options[key];
    },

    token: function () {
        return this.tokenizer.token();
    },

    error: function (token) {
        console.error('Unxpected token: "' + token.value + '"; Line: ' + token.loc.start.line + '"; Column: ' + token.loc.start.column);
        console.trace();
    },

    create: function (type) {
        return {
            type: type
        };
    },

    detect: function () {
        var token = this.token(),

            types = ['Element', 'Helper', 'Expression', 'Identifier', 'String', 'JavaScript', 'Text'],

            // Typ dete
            is = {
                'Element': function () {
                    // Read next token
                    var next = token.next();

                    // Reset token walk;
                    next.prev();

                    return token.type === 'Punctuator' && token.value === '<' &&
                        next.type !== 'Punctuator';
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
                        next.type !== 'Punctuator'
                    );
                },
                'String': function () {
                    return token.type === 'JavaScript' && (/^"/).test(token.value);
                },
                'JavaScript': function () {
                    return token.type === 'JavaScript';
                },
                // Data identifier in expression
                'Identifier': function () {
                    return token.type === 'Word' && (/^([a-z][a-z0-9\-_]*)$/i).test(token.value)
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

    Identifier: function () {
        var node = this.create('Identifier'),
            token = this.token();

        node.name = token.value;

        // Next after Identifier
        this.token().next();

        return node;
    },

    String: function () {
        var node = this.create('String'),
            token = this.token();

        node.name = token.value;

        // Next after String
        this.token().next();

        return node;
    },

    JavaScript: function () {
        var node = this.create('JavaScript'),
            token = this.token();

        node.value = token.value;

        // Next after JavaScript
        this.token().next();

        return node;
    },

    Template: function () {
        var node = this.create('Template'),
            token = this.token().findNextNotEmpty(true);

        node.element = this.detect('Element');

        return node;
    },

    Element: function (token) {
        var node = this.create('Element'),
            token = this.token();

        if (token.type !== 'Punctuator' && token.value !== '<') {
            return this.error(token);
        }

        // Next not empty after element opening
        token = this.token().findNextNotEmpty();

        if (token.isElementIdentifier()) {
            node.name = this.Identifier();
        } else {
            return this.error(token);
        }

        node.attributes = this.Attributes();

        // Read current token
        token = this.token();

        if (token.type === 'Punctuator' && token.value === '/') {
            node.selfClosing = true;

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
        if (node.selfClosing) {
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

        if (!token.isElementIdentifier() || token.value !== node.name.name) {
            return this.error(token);
        }

        // Next after not empty
        token = this.token().findNextNotEmpty();

        if (token.type !== 'Punctuator' && token.value !== '>') {
            return this.error(token);
        }

        // Next after element end
        token = this.token().next();

        return node;
    },

    Attributes: function () {
        var list = [],
            node;

        this.option('attributeScope', true);

        while (list) {
            node = this.Attribute();

            if (node) {
                list.push(node);
            } else {
                break;
            }
        }

        this.option('attributeScope', false);

        return list;
    },

    Attribute: function () {
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

            node.value = this.detect('Helper', 'Expression', 'String');

            if (!node.value) {
                return this.error(token);
            }
        } else {
            node.value = null;
        }

        return node;
    },

    // '{ expression [+ expression] }'
    Expression: function () {
        var node = this.create('Expression'),
            token = this.token();

        // Expect open brace
        if (token.isBraceOpen()) {
            token = this.token().next();
        } else {
            return this.error(token);
        }

        node.expression = this.Expressions();

        token = this.token().findNextNotEmpty(true);

        if (!token.isBraceClose()) {
            return this.error(token);
        } else {
            token.next();
        }

        return node;
    },

    // { 'expression [+ expression]' }
    Expressions: function () {
        var list = [],
            token = this.token().findNextNotEmpty(true),
            node;

        while (list) {
            node = this.detect('JavaScript', 'Identifier', 'Expression', 'Helper');

            if (node) {
                list.push(node);
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

        return list;
    },

    Helper: function () {
        var node = this.create('Helper'),
            token = this.token();

        // Expect open brace
        if (token.isBraceOpen()) {
            token = this.token().next();
        } else {
            return this.error(token);
        }

        // Expect helper declaration char
        if (token.type === 'Punctuator' && token.value === '#') {
            token = this.token().next();
        } else {
            return this.error(token);
        }

        if (token.isHelperIdentifier()) {
            node.name = this.Identifier();

            // Not empty after Identifier
            token = this.token().findNextNotEmpty(true);

            if (token.isHelperClosing()) {
                // Helper without argument and self closing
                node.argument = null;
            } else if (token.isBraceClose()) {
                // Helper without argument
                node.argument = null;
            } else if (token.isDataIdentifier()) {
                // Helper argument
                node.argument = this.Identifier();

                token = this.token().findNextNotEmpty(true);
            } else {
                return this.error(token);
            }

            // Self closing helper (no block helper)
            if (token.isHelperClosing()) {
                node.selfClosing = true;

                // Next after self closing slash
                token = this.token().next().next();
            }

            if (token.isBraceClose()) {
                // Next after closing brace
                token = this.token().next();

                // Skip body if self closing
                if (node.selfClosing) {
                    return node;
                }
            } else {
                return this.error(token);
            }

            // Use expression only on attribute context
            if (this.option('attributeScope')) {
                node.body = this.create('Expression');
                node.body.expression = this.Expressions();
            } else {
                node.body = this.Block();
            }

            // Read current token
            token = this.token();

            if (!token.isBraceOpen()) {
                return this.error(token);
            }

            // Next after open brace
            token = this.token().next();

            if (token.isHelperAlternate()) {
                // Go to closing brace of else statement
                token = this.token().next();

                if (!token.isBraceClose()) {
                    return this.error(token);
                }

                // Next after else closing brace
                token = this.token().next();

                node.alternateBody = this.create('Expression');
                node.alternateBody.expression = this.Expressions();

                // Read current token
                token = this.token();

                if (!token.isBraceOpen()) {
                    return this.error(token);
                }

                // Next after open brace
                token = this.token().next();
            }

            token = this.token();

            if (token.isHelperClosing()) {
                token = this.token().next();

                if (token.isHelperIdentifier() && token.value === node.name.name) {
                    // Next after helper closing identifier
                    token = this.token().next();

                    if (!token.isBraceClose()) {
                        return this.error(token);
                    }

                    // Next after closing brace
                    token = this.token().next();

                    return node;
                } else {
                    return this.error(token);
                }
            } else {
                return this.error(this.token());
            }

        } else {
            return this.error(token);
        }

        return node;
    },

    Text: function () {
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

    Block: function () {
        var node = this.create('Block'),
            token = this.token().findNextNotEmpty(true),
            childNode;

        node.body = [];

        while (node.body) {
            childNode = this.detect('Element', 'Expression', 'Helper', 'Text');
            if (childNode) {
                node.body.push(childNode);
            } else {
                break;
            }

            token = this.token().findNextNotEmpty(true);
        }

        return node;
    }
};

console.log(JSON.stringify(new Parser(require('fs').readFileSync('./test/test.vandyke').toString()), null, 4));
