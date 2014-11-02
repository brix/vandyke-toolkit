/*global require, exports, module*/

var Traverser = require('./traverser'),
    Composer;

Composer = function Composer(options) {
    this.options = {
        indent: '    ',
        lineBreak: '\n'
    };

    this.content = '';
    this._indent = 0;
};

Composer.compose = function compose(ast, options) {
    var composer = new this(options)

    composer.compose(ast);

    return composer.content;
};

Composer.prototype = {
    compose: function (ast) {
        var that = this;

        Traverser.traverse(ast, {
            enter: function (node) {
                if (that[node.type + 'Enter']) {
                    that[node.type + 'Enter'](node, this);
                }
            },
            leave: function (node) {
                if (that[node.type + 'Leave']) {
                    that[node.type + 'Leave'](node, this);
                }
            }
        });
    },

    option: function (key, val) {
        if (arguments.length === 2) {
            this.options[key] = val;
        }

        return this.options[key];
    },

    write: function (chunk) {
        var lineBreak = this.option('lineBreak'),
            i = 0;

        if (this.content.substr(this.content.length - lineBreak.length, lineBreak.length) === lineBreak) {
            while (i < this._indent) {
                this.content += this.option('indent');
                i++;
            }
        }

        this.content += chunk;

        return this;
    },

    writeString: function (chunk) {
        return this.write(JSON.stringify(chunk.toString()));
    },

    lineBreak: function () {
        this.content += this.option('lineBreak');

        return this;
    },

    indentInc: function () {
        this._indent++;

        return this;
    },

    indentDec: function () {
        this._indent--;

        return this;
    },

    TemplateEnter: function (node, ctx) {
        this.write('function () {')
            .lineBreak()
            .indentInc();
    },
    TemplateLeave: function (node, ctx) {
        this.indentDec()
            .write('}');
    },

    ElementOpeningEnter: function (node, ctx) {
        this.write('<')
            .write(node.name.name);
    },
    ElementOpeningLeave: function (node, ctx) {
        if (node.selfClosing) {
            this.write('/>')
                .lineBreak();
        } else {
            this.write('>');
        }
    },

    ElementClosingEnter: function (node, ctx) {
        this.write('</')
            .write(node.name.name);
    },
    ElementClosingLeave: function (node, ctx) {
        this.write('>')
            .lineBreak();
    },

    HelperOpeningEnter: function (node, ctx) {
        if (!this.option('.propertyScope')) {
            this.write('{')
        }

        this.write('helper(')
            .writeString(node.name.name)
            .write(', ')
            .write(node.arguments.length)
            .write(', ');
    },
    HelperOpeningLeave: function (node, ctx) {
        if (node.selfClosing) {
            this.write(')');
        }
    },

    HelperAlternateEnter: function (node, ctx) {
        this.write(', ');
    },

    HelperClosingLeave: function (node, ctx) {
        if (node.selfClosing) {
            this.write(')');
        }

        if (!this.option('.propertyScope')) {
            this.write('}')
        }
    },

    DataEnter: function (node, ctx) {
        if (ctx.parent().type === 'Element') {
            this.write('{');
        }

        this.write('data(')
            .writeString(node.name.name)
            .write('), ');

        if (ctx.parent().type === 'Element') {
            this.write('}');
        }
    },

    ExpressionEnter: function (node, ctx) {
        this.write('expression(');
    },
    ExpressionLeave: function (node, ctx) {
        this.write(')');
    },

    BlockEnter: function (node, ctx) {
        if (ctx.parent().type !== 'Element') {
            this.write('block(');
        }

        this.lineBreak()
            .indentInc();
    },
    BlockLeave: function (node, ctx) {
        this.indentDec()
            .lineBreak();

        if (ctx.parent().type !== 'Element') {
            this.write(')');
        }
    },

    PropertyEnter: function (node, ctx) {
        this.write(' ')
            .write(node.name.name)
            .write('=');

        this.option('.propertyScope', true);

        if (node.value === null) {
            this.write('{true}');
        } else if (node.value.type !== 'String') {
            this.write('{');
        }
    },

    PropertyLeave: function (node, ctx) {
        this.option('.propertyScope', false);

        if (node.value !== null && node.value.type !== 'String') {
            this.write('}');
        }
    },

    StringEnter: function (node, ctx) {
        this.write(node.value);
    },

    JavaScriptEnter: function (node, ctx) {
        this.write(node.value);
    }
};

module.exports = Composer;
