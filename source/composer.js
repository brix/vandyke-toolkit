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

    write: function (chunk) {
        var i = 0;

        if (this.content.substr(this.content.length - this.options.lineBreak.length, this.options.lineBreak.length) === this.options.lineBreak) {
            while (i < this._indent) {
                this.content += this.options.indent;
                i++;
            }
        }

        this.content += chunk;

        return this;
    },

    writeString: function (chunk) {
        this.write(JSON.stringify(chunk.toString()));
    },

    lineBreak: function () {
        this.content += this.options.lineBreak;

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
            this.write('/>');
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

    HelperEnter: function (node, ctx) {
        this.write('{vd.helper(')
            .writeString(node.name.name);
    },
    
    BlockEnter: function (node, ctx) {
        this.lineBreak()
            .indentInc();  
    },
    BlockLeave: function (node, ctx) {
        this.indentDec()
            .lineBreak();  
    },

    HelperLeave: function (node, ctx) {
        this.write(')}');
    },

    PropertyEnter: function (node, ctx) {
        this.write(' ')
            .write(node.name.name)
            .write('=');

        if (node.value === null) {
            this.write('{true}');
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
