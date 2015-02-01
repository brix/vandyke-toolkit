/*global require, exports, module*/

var Cla55 = require('cla55').Cla55,
    Traverser = require('./traverser'),
    Composer;

Composer = Cla55.extend({
    constructor: function constructor(options) {
        this.options = {
            map: true,
            indent: '    ',
            lineBreak: '\n'
        };

        this.content = '';
        this._indent = 0;
    },

    propsMap: {
        'class': 'className'
    },

    compose: function compose(ast) {
        var that = this;

        Traverser.traverse(ast, {
            enter: function (node) {
                if (that[node.type] && that[node.type].enter) {
                    that[node.type].enter.call(that, this, node);
                }
            },
            leave: function (node) {
                if (that[node.type] && that[node.type].leave) {
                    that[node.type].leave.call(that, this, node);
                }
            },
            before: function (node, key) {
                if (that[node.type] && that[node.type][key] && that[node.type][key].before) {
                    that[node.type][key].before.call(that, this, node);
                }
            },
            after: function (node, key) {
                if (that[node.type] && that[node.type][key] && that[node.type][key].after) {
                    that[node.type][key].after.call(that, this, node);
                }
            },
            beforeEach: function (node, key, i) {
                if (that[node.type] && that[node.type][key] && that[node.type][key].beforeEach) {
                    that[node.type][key].beforeEach.call(that, this, node, i);
                }
            },
            afterEach: function (node, key, i) {
                if (that[node.type] && that[node.type][key] && that[node.type][key].afterEach) {
                    that[node.type][key].afterEach.call(that, this, node, i);
                }
            }
        });
    },

    option: function options(key, val) {
        if (arguments.length === 2) {
            this.options[key] = val;
        }

        return this.options[key];
    },

    write: function write(chunk) {
        var lineBreak = this.option('lineBreak'),
            i = 0;

        // Generate indent only for new line
        if (this.content.substr(this.content.length - lineBreak.length, lineBreak.length) === lineBreak) {
            while (i < this._indent) {
                this.content += this.option('indent');
                i++;
            }
        }

        this.content += chunk;

        return this;
    },

    writeString: function writeString(chunk) {
        return this.write(JSON.stringify(chunk.toString()));
    },

    lineBreak: function lineBreak() {
        var lineBreak = this.option('lineBreak'),
            i = 0;

        // Prevent double line breaks
        if (this.content.substr(this.content.length - lineBreak.length, lineBreak.length) === lineBreak) {
            return this;
        }

        this.content += this.option('lineBreak');

        return this;
    },

    indentInc: function indentInc() {
        this._indent++;

        return this;
    },

    indentDec: function indentDec() {
        this._indent--;

        return this;
    },

    Template: {
        enter: function (ctx, node) {
            this.write('function template() {')
                .lineBreak()
                .indentInc()
                .write('var ')
                .indentInc()
                .write('that = this,')
                .lineBreak()
                .write('React = that.React,')
                .lineBreak()
                .write('Components = that.components;')
                .lineBreak()
                .indentDec()
                .lineBreak()
                .write('return (')
                .indentInc()
                .lineBreak();
        },
        leave: function (ctx, node) {
            this.indentDec()
                .lineBreak()
                .write(');')
                .lineBreak()
                .indentDec()
                .write('}');
        }
    },

    ElementOpening: {
        enter: function (ctx, node) {
            this.lineBreak()
                .write('<')
                .write(node.name.name);
        },
        leave: function (ctx, node) {
            if (node.selfClosing) {
                this.write('/>');
            } else {
                this.write('>');
            }
        }
    },

    ElementClosing: {
        enter: function (ctx, node) {
            this.write('</')
                .write(node.name.name);
        },
        leave: function (ctx, node) {
            this.write('>');
        }
    },

    Helper: {
        enter: function (ctx, node) {
            this.write('that.helper(');
        },
        leave: function (ctx, node) {
            this.write(')');
        },
        body: {
            before: function (ctx, node) {
                this.write(', function () {')
                    .indentInc()
                    .lineBreak()
                    .write('return (');
            },
            after: function (ctx, node) {
                this.write(');')
                    .indentDec()
                    .lineBreak()
                    .write('}');
            }
        }
    },

    HelperOpening: {
        enter: function (ctx, node) {
            this.writeString(node.name.name);
        },
        arguments: {
            before: function (ctx, node) {
                this.write(', [');
            },
            after: function (ctx, node) {
                this.write(']');
            }
        }
    },

    HelperAlternate: {
        body: {
            before: function (ctx, node) {
                this.write(', function () {')
                    .indentInc()
                    .lineBreak()
                    .write('return ');
            },
            after: function (ctx, node) {
                this.write(';')
                    .indentDec()
                    .lineBreak()
                    .write('}');
            }
        }
    },

    Data: {
        enter: function (ctx, node) {
            this.write('that.data(')
                .writeString(node.name.name)
                .write(node.scope ? ', true' : '')
                .write(')');
        }
    },

    Expression: {
        enter: function (ctx, node) {
            this.write('{');
        },
        leave: function (ctx, node) {
            this.write('}');
        }
    },

    Concat: {
        enter: function (ctx, node) {
            this.write('that.concat(');
        },
        leave: function (ctx, node) {
            this.write(')');
        },
        concat: {
            beforeEach: function (ctx, node, i) {
                if (i) {
                    this.write(', ');
                }
            }
        }
    },

    ListBlock: {
        enter: function (ctx, node) {
            this.write('that.list(')
                .lineBreak()
                .indentInc();
        },
        leave: function (ctx, node) {
            this.indentDec()
                .lineBreak()
                .write(')');
        },
        list: {
            beforeEach: function (ctx, node, i) {
                if (i) {
                    this.write(', ');
                }
            }
        }
    },

    Block: {
        enter: function (ctx, node) {
            if (ctx.parent().type !== 'Element') {
                this.write('that.block(');
            }

            this.lineBreak()
                .indentInc();
        },
        leave: function (ctx, node) {
            this.indentDec()
                .lineBreak();

            if (ctx.parent().type !== 'Element') {
                this.write(')');
            }
        }
    },

    Property: {
        enter: function (ctx, node) {
            var name = (this.options.map && this.propsMap[node.name.name]) || node.name.name;

            this.write(' ')
                .write(name)
                .write('=');

            if (node.value === null) {
                this.write('{true}');
            }
        },
        leave: function (ctx, node) {

        }
    },

    Text: {
        enter: function (ctx, node) {
            this.write(node.value);
        }
    },

    String: {
        enter: function (ctx, node) {
            this.write(node.value);
        }
    },

    JavaScript: {
        enter: function (ctx, node) {
            this.write(node.value);
        }
    }
}, {
    compose: function compose(ast, options) {
        var composer = new this(options)

        composer.compose(ast);

        return composer.content;
    }
});

module.exports = Composer;
