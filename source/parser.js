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
        console.error('Unxpected token: "' + token.value + '"; Range: ' + token.range.join(', '));
        console.trace();
    },

    createNode: function (type) {
        return {
            type: type
        };
    },

    Identifier: function () {
        var node = this.createNode('Identifier'),
            token = this.token();

        node.name = token.value;

        return node;
    },

    String: function () {
        var node = this.createNode('String'),
            token = this.token();

        node.name = token.value;

        return node;
    },

    JavaScript: function () {
        var node = this.createNode('JavaScript'),
            token = this.token();

        node.value = token.value;

        return node;
    },

    Template: function () {
        var node = this.createNode('Template'),
            token = this.token().findNextNotEmpty(true);

        node.element = this.Element();

        return node;
    },

    Element: function (token) {
        var node = this.createNode('Element'),
            token = this.token();

        if (token.type === 'Punctuator' && token.value === '<') {
            // Next not empty after element opening
            token = this.token().findNextNotEmpty();

            node.elementOpening = this.ElementOpening();
        } else {
            return this.error(token);
        }

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

        return node;
    },

    ElementOpening: function () {
        var node = this.createNode('ElementOpening'),
            token = this.token();

        if (token.isElementIdentifier()) {
            node.name = this.Identifier();
        } else {
            return this.error(token);
        }

        // Next after identifier
        token = this.token().next();

        node.attributes = this.Attributes();


        // Next after identifier
        token = this.token();

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
        var node = this.createNode('Property'),
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

            if (token.isAttributeString()) {
                node.value = this.String();
                token.next();
            } else if (token.isBraceOpen()) {
                node.value = this.Expression();
            } else {
                return this.error(token);
            }
        } else {
            node.value = null;
        }

        return node;
    },

    // '{ expression [+ expression] }'
    Expression: function () {
        var node,
            token = this.token().next();

        if (token.isHelperOpening()) {
            node = this.Helper();
        } else {
            node = this.createNode('Expression');
            node.expression = this.Expressions();

            token = this.token().findNextNotEmpty(true);

            if (!token.isBraceClose()) {
                return this.error(token);
            } else {
                token.next();
            }
        }

        return node;
    },

    // { 'expression [+ expression]' }
    Expressions: function () {
        var list = [],
            token = this.token().findNextNotEmpty(true),
            node;

        while (list) {
            if (token.type === 'JavaScript') {
                list.push(this.JavaScript());
            } else if (token.isDataIdentifier()) {
                list.push(this.Identifier());
            } else if (token.isBraceOpen()) {
                list.push(this.Expression());
            } else {
                return this.error(token);
            }

            token = this.token().findNextNotEmpty();

            if (token.type === 'Punctuator' && token.value === '+') {
                token = this.token().findNextNotEmpty();
            } else {
                break;
            }
        }

        return list;
    },

    Helper: function () {
        var node = this.createNode('Helper'),
            token = this.token().next();

        if (token.isHelperIdentifier()) {
            node.name = this.Identifier();

            token = this.token().findNextNotEmpty();

            if (token.isHelperClosing()) {
                // Helper without argument and self closing
                node.argument = null;
            } else if (token.isBraceClose()) {
                // Helper without argument
                node.argument = null;
            } else if (token.isDataIdentifier()) {
                // Helper argument
                node.argument = this.Identifier();

                token = this.token().findNextNotEmpty();
            } else {
                return this.error(token);
            }

            // Self closing helper (no block helper)
            if (token.isHelperClosing()) {
                node.selfClosing  = true;

                // Next after self closing slash
                token = this.token().next();

                return node;
            }


            if (!token.isBraceClose()) {
                return this.error(token);
            }

            // Next after open brace
            token = this.token().next();

            // Use expression only on attribute context
            if (this.option('attributeScope')) {
                node.body = this.createNode('Expression');
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
                token = this.token().next().next();

                if (!token.isBraceClose()) {
                    return this.error(token);
                }

                // Next after else closing brace
                token = this.token().next();

                node.alternateBody = this.createNode('Expression');
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
        var node = this.createNode('Text'),
            token = this.token();

        node.value = '';

        while (node.value) {
            if (token.isTextSnippet()) {
                node.value += token.value;
            } else {
                // Back to prev
                token = this.token().prev();
                break;
            }

            token = this.token().next();
        }
        
        return node;
    },

    Block: function () {
        var node = this.createNode('Block'),
            token = this.token().findNextNotEmpty();

        node.body = [];

        while (node.body) {
            if (token.type === 'Punctuator' && token.value === '{') {
                node.body.push(this.Expression());
            } else if (token.type === 'Punctuator' && token.value === '<') {
                node.body.push(this.Element());
            } else if (token.isTextSnippet()) {
                node.body.push(this.Text());
            } else {
                break;
            }

            token = this.token().findNextNotEmpty();
        }

        return node;
    }
};

console.log(JSON.stringify(new Parser(require('fs').readFileSync('./test/test.vandyke').toString()), null, 4));
