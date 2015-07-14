'use strict';

var Cla55 = require('cla55'),
    Tokenizer = require('./tokenizer'),
    Parser;

Parser = Cla55.extend({
    constructor: function constructor(options) {
        this.options = options || {};

        this.ast = this.createNode('AST', {
            body: []
        });
    },

    // Reference tokenizer class
    Tokenizer: Tokenizer,

    tokenizerMap: {
        'token': 'token',
        'prev': 'prev',
        'next': 'next',
        'findPrevEmpty': 'findPrevEmpty',
        'findNextEmpty': 'findNextEmpty',
        'findPrevNotEmpty': 'findPrevNotEmpty',
        'findNextNotEmpty': 'findNextNotEmpty'
    },

    parse: function parse(source) {
        var tokenizer = new this.Tokenizer(),

            method;

        for (method in this.tokenizerMap) {
            this[method] = tokenizer[this.tokenizerMap[method]].bind(tokenizer);
        }

        tokenizer.parse(source);

        return this.AST();
    },

    option: function option(key, val) {
        if (arguments.length === 2) {
            this.options[key] = val;
        }

        return this.options[key];
    },

    expect: function (truthy) {
        if (!truthy) {
            var token = this.token(),
                error = new Error('Unxpected token: "' + token.value + '"; Line: ' + token.loc.start.line + '"; Column: ' + token.loc.start.column);

            throw error;
        }
    },

    createNode: function createNode(type, obj) {
        if (!obj) {
            obj = {};
        }

        obj.type = type;

        return obj;
    },

    detect: function detect() {
        var token = this.token(),

            // Array of accepted types give by arguments
            accept = Array.prototype.slice.call(arguments, 0),

            // Loop variables
            i, l, type;

        for (i = 0, l = this.detectPriority.length; i < l; i++) {
            type = this.detectPriority[i];

            if (accept.indexOf(type) !== -1 && this['detectIs' + type](token)) {
                return this[type](token);
            }
        }

        return null;
    },

    detectPriority: ['Element', 'Helper', 'Expression', 'Listener', 'Concat', 'List', 'Data', 'String', 'Number', 'Boolean', 'Text'],

    detectIsElement: function (token) {
        return token.is('Punctuator') && token.hasValue('<');
    },

    detectIsHelper: function (token) {
        return token.is('Punctuator') && token.hasValue('{#');
    },

    detectIsExpression: function (token) {
        return token.is('Punctuator') && token.hasValue('{#', '{');
    },

    detectIsString: function (token) {
        return token.is('String');
    },

    detectIsNumber: function (token) {
        return token.is('Number');
    },

    detectIsBoolean: function (token) {
        return token.is('Boolean');
    },

    detectIsConcat: function () {
        return this.option('._ctx_attribute');
    },

    detectIsList: function () {
        return !this.option('._ctx_attribute');
    },

    detectIsListener: function (token) {
        return this.option('._ctx_attribute') && this.option('._ctx_listener') && token.is('Identifier');
    },

    detectIsData: function (token) {
        return (
            (token.is('Punctuator') && token.hasValue('@', '../')) ||
            token.is('NumberIdentifier') ||
            token.is('Identifier')
        );
    },

    detectIsText: function (token) {
        return token.isNot('Punctuator') || token.hasNotValue(/(^(\{|<)|(>|\}))/);
    },

    Attribute: function Attribute() {
        var token = this.token(),
            node;

        // Expect white space
        if (token.isNot('Empty')) {
            return;
        }

        // Read next not empty token
        token = this.findNextNotEmpty().token();

        // Expect identifier
        this.expect(token.is('Identifier') || (token.is('Punctuator') && token.hasValue('{')));

        if (token.is('Identifier')) {
            node = this.createNode('Property');

            // Check whether the attribute is an event listener
            this.option('._ctx_listener', token.hasValue(/^on/));

            // Get name identifier
            node.name = this.Identifier();

            // Read token
            token = this.token();

            if (token.is('Punctuator') && token.hasValue('=')) {
                // Attribute with value
                this.next();

                // Detect value
                node.value = this.detect('String', 'Expression');

                this.expect(node.value);
            } else {
                // Attribute without value
                node.value = null;
            }

            // Clear listener context
            this.option('._ctx_listener', false);
        } else {
            node = this.Expression();
        }

        return node;
    },

    Attributes: function Attributes() {
        var list = [],
            node;

        // Set attribute context
        this.option('._ctx_attribute', true);

        while (list) {
            // Get attribute
            node = this.Attribute();

            if (node) {
                // Add to list
                list.push(node);
            } else {
                // Stop reading attributes
                break;
            }
        }

        // Clear attribute context
        this.option('._ctx_attribute', false);

        return list;
    },

    AST: function AST() {
        var node;

        while (this.token()) {
            // Detect ast body content
            node = this.detect('Element', 'Expression', 'Text');

            if (node) {
                // Add to body
                this.ast.body.push(node);
            } else {
                // Stop reading ast body
                break;
            }
        }

        return this.ast;
    },

    Boolean: function Boolean() {
        var node = this.createNode('Boolean'),
            token = this.token();

        this.expect(token.is('Boolean'));

        node.value = token.value;

        // Next after String
        this.next().token();

        return node;
    },

    Block: function Block() {
        var node = this.createNode('Block'),
            childNode;

        this.findNextNotEmpty(true);

        node.body = [];

        while (this.token()) {
            // Detect block body content
            childNode = this.detect('Element', 'Expression', 'Text');

            if (childNode) {
                // Add to body
                node.body.push(childNode);
            } else {
                // Stop reading block body
                break;
            }
        }

        return node;
    },

    Concat: function Concat() {
        var node = this.createNode('Concat', {
                concat: []
            }),
            token = this.findNextNotEmpty(true).token(),
            childNode;

        while (this.token()) {
            // Detect concat item
            childNode = this.detect('String', 'Number', 'Boolean', 'Data', 'Helper');

            if (childNode) {
                // Add to concat list
                node.concat.push(childNode);
            } else {
                // Stop concatenate items
                break;
            }

            // Read next/current not empty token
            token = this.findNextNotEmpty(true).token();

            if (token.is('Punctuator') && token.hasValue('+')) {
                // Continue reading concatenate items
                this.findNextNotEmpty();
            } else {
                // Stop concatenate items
                break;
            }
        }

        // Return null if nothing to concatenate
        if (node.concat.length === 0) {
            return null;
        }

        // Return first item if only one exists
        if (node.concat.length === 1) {
            return node.concat[0];
        }

        // Return the concat node with its items
        return node;
    },

    Data: function Data() {
        var node = this.createNode('Data', {
                scope: false,
                path: []
            }),
            token = this.token();

        if (token.is('Punctuator') && token.hasValue('@')) {
            node.scope = true;

            this.next();
        }

        // Read parent level path
        while (this.token()) {
            token = this.token();

            if (token.is('Punctuator') && token.hasValue('../')) {
                node.path.push(this.createNode('Identifier', {
                    name: '..'
                }));

                this.next();
            } else {
                break;
            }
        }

        // Read token
        token = this.token();

        // Expect minimum one data path item
        this.expect(token.is('Identifier') || token.is('NumberIdentifier'));

        // Read data path
        while (this.token()) {
            // Read token
            token = this.token();

            if (token.is('Identifier') || token.is('NumberIdentifier')) {
                node.path.push(this.Identifier());

                // Read token
                token = this.token();

                // Check for more path items
                if (token.is('Punctuator') && token.hasValue('.')) {
                    // Read next token
                    token = this.next().token();

                    this.expect(token.is('Identifier') || token.is('NumberIdentifier'));
                }
            } else {
                break;
            }
        }

        return node;
    },

    Element: function Element() {
        var node = this.createNode('Element'),
            token = this.token();

        this.expect(this.detectIsElement(token));

        // Read next token
        token = this.next().token();

        // Expect identifier
        this.expect(token.is('Identifier'));

        node.elementOpening = this.createNode('ElementOpening');

        // Get element name identifier
        node.elementOpening.name = this.Identifier();

        // Get element attributes
        node.elementOpening.attributes = this.Attributes();

        // Read current token
        token = this.token();

        if (token.is('Punctuator') && token.hasValue('/>')) {
            // Self closing element
            node.elementOpening.selfClosing = true;
        } else {
            // Block element

            // Expect close of element opening
            this.expect(token.is('Punctuator') && token.hasValue('>'));

            // Read next token
            token = this.next().token();

            // Get element body
            node.body = this.Block();

            // Read next/current not empty token
            token = this.findNextNotEmpty(true).token();

            // Expect element closing
            this.expect(token.is('Punctuator') && token.hasValue('</'));

            // Read next not empty token
            token = this.findNextNotEmpty().token();

            // Expect closing identifier is equal to opening identifier
            this.expect(token.is('Identifier') && token.hasValue(node.elementOpening.name.name));

            node.elementClosing = this.createNode('ElementClosing');

            // Get element closing identifier
            node.elementClosing.name = this.Identifier();

            // Read next/current not empty token
            token = this.findNextNotEmpty(true).token();

            // Expect close of element closing
            this.expect(token.is('Punctuator') && token.hasValue('>'));
        }

        // Next token
        this.next();

        return node;
    },

    // '{ expression }'
    Expression: function Expression() {
        var node = this.createNode('Expression'),
            token = this.token();

        // Expect open brace
        this.expect(this.detectIsExpression(token));

        if (token.is('Punctuator') && token.hasValue('{#')) {
            // Get expression as helper
            node.expression = this.Helper();
        } else {
            // Read next not empty token
            token = this.findNextNotEmpty().token();

            // Detect expression
            node.expression = this.detect('Listener', 'Concat', 'String', 'Boolean', 'Number', 'Data');

            this.expect(node.expression);

            // Read next/current not empty token
            token = this.findNextNotEmpty(true).token();

            // Expect close brace
            this.expect(token.is('Punctuator') && token.hasValue('}'));

            // Next token
            this.next();
        }

        return node;
    },

    Helper: function Helper() {
        var node = this.createNode('Helper'),
            token = this.token(),
            argument;

        // Expect helper declaration
        this.expect(this.detectIsHelper(token));

        // Read next token
        token = this.next().token();

        this.expect(token.is('Identifier'));

        node.helperOpening = this.createNode('HelperOpening');

        // Get helper name identifier
        node.helperOpening.name = this.Identifier();

        // Read next/current not empty token
        token = this.findNextNotEmpty(true).token();

        if (token.is('Punctuator') && token.hasValue('}', '/}')) {
            // Helper without arguments
            node.helperOpening.arguments = [];
        } else {
            // Detect helper arguments
            argument = this.detect('Data', 'String', 'Number', 'Boolean');

            this.expect(argument);

            node.helperOpening.arguments = [argument];

            // Read next/current not empty token
            token = this.findNextNotEmpty(true).token();
        }

        if (token.is('Punctuator') && token.hasValue('/}')) {
            // Self closing helper
            node.helperOpening.selfClosing = true;
            node.body = null;
            node.helperAlternate = null;
            node.helperClosing = null;
        } else {
            // Block helper

            // Expect close brace
            this.expect(token.is('Punctuator') && token.hasValue('}'));

            // Read next token
            token = this.next().token();

            // Detect helper body
            node.body = this.detect('Concat', 'List');

            // Read token
            token = this.token();

            if (token.is('Punctuator') && token.hasValue('{:')) {
                // Next token
                this.next();

                node.helperAlternate = this.createNode('HelperAlternate');

                // Get helper alternate name identifier
                node.helperAlternate.name = this.Identifier();

                // Read token
                token = this.token();

                // Expect close brace
                this.expect(token.is('Punctuator') && token.hasValue('}'));

                // Next token
                this.next();

                // Helper body concat or list block
                node.helperAlternate.body = this.detect('Concat', 'List');
            } else {
                // Without helper alternate body
                node.helperAlternate = null;
            }

            // Read token
            token = this.token();

            // Expect helper closing
            this.expect(token.is('Punctuator') && token.hasValue('{/'));

            // Read next token
            token = this.next().token();

            // Expect match of closing helper identifier
            this.expect(token.is('Identifier') && token.hasValue(node.helperOpening.name.name));

            node.helperClosing = this.createNode('HelperClosing');

            // Get helper closing name identifier
            node.helperClosing.name = this.Identifier();

            // Read token
            token = this.token();

            // Expect close brace
            this.expect(token.is('Punctuator') && token.hasValue('}'));
        }

        // Next token
        this.next();

        return node;
    },

    Identifier: function Identifier() {
        var node = this.createNode('Identifier'),
            token = this.token();

        node.name = token.value;

        // Next after Identifier
        this.next().token();

        return node;
    },

    List: function List() {
        var node = this.createNode('List'),
            childNode;

        this.findNextNotEmpty(true);

        node.list = [];

        while (this.token()) {
            // Detect list block items
            childNode = this.detect('Element', 'Expression', 'Text');

            if (childNode) {
                // Add list block item
                node.list.push(childNode);
            } else {
                // Stop reading list block items
                break;
            }
        }

        // Return null if list has no items
        if (node.list.length === 0) {
            return null;
        }

        // Return first item if only one exists
        if (node.list.length === 1) {
            return node.list[0];
        }

        // Return list block node
        return node;
    },

    Listener: function () {
        var node = this.createNode('Listener'),
            token = this.token();

        // Get listener name identifier
        this.expect(token.is('Identifier'));

        node.name = this.Identifier();

        return node;
    },

    Number: function Number() {
        var node = this.createNode('Number'),
            token = this.token();

        this.expect(token.is('Number'));

        node.value = token.value;

        // Next token
        this.next();

        return node;
    },

    String: function String() {
        var node = this.createNode('String'),
            token = this.token();

        this.expect(token.is('String'));

        node.value = token.value;

        // Next token
        this.next();

        return node;
    },

    Text: function Text() {
        var node = this.createNode('Text'),
            token = this.token(),
            snippets = [];

        // Read prev token
        token = this.prev().token();

        // Find all prev empty tokens
        if (token.is('Empty')) {
            this.findPrevNotEmpty();
        }

        // Read next token
        token = this.next().token();

        // Test token for text validity
        this.expect(this.detectIsText(token));

        while (this.token()) {
            // Read token
            token = this.token();

            // Test token for text validity
            if (this.detectIsText(token)) {
                // Add text token
                snippets.push(token);
            } else {
                // Stop reading text tokens
                break;
            }

            // Next token
            this.next();
        }

        // Merge snippets to text value
        node.value = snippets
            .map(function (snippet) {
                return snippet.value;
            })
            .join('');

        return node;
    }
}, {
    parse: function parse(source) {
        return new this().parse(source);
    }
});

module.exports = Parser;
