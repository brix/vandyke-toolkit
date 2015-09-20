;(function (root, factory) {
    if (typeof exports === 'object') {
        // CommonJS
        factory(require, exports, module);
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['require', 'exports', 'module', 'cla55', './writer', './traverser'], factory);
    } else {
        console && console.error('Unsupported module environment.'); // jshint ignore:line
    }
}(this, function (require, exports, module) {

    'use strict';

    var Cla55 = require('cla55'),

        Writer = require('./writer'),
        Traverser = require('./traverser'),
        Composer;

    Composer = Cla55.extend({
        constructor: function constructor(options) {
            this._options = {
                map: options && options.map === false ? false : true,
                indent: options && options.indent || '    ',
                lineBreak: options && options.lineBreak || '\n'
            };

            this._content = new Writer({
                indent: this.option('indent'),
                lineBreak: this.option('lineBreak')
            });

            this._proxies = [];
        },

        // Reference traverser class
        Traverser: Traverser,

        compose: function compose(ast) {
            var that = this;

            // Expect argument ast
            if (!ast) {
                throw 'Missing argument \'ast\'.';
            }

            // Create copy, do not manipulate the original ast
            ast = JSON.parse(JSON.stringify(ast));

            // Extpact root node from type AST
            if (ast.type !== 'AST') {
                throw 'Expected node from type \'AST\'.';
            }

            // Filter: skip empty text nodes
            ast.body = ast.body.filter(function (node) {
                return node.type !== 'Text' || !/^\s*$/.test(node.value);
            });

            // Expect exactly one body item
            if (ast.body.length !== 1) {
                throw 'Expected exactly on body item for AST.';
            }

            this.Traverser.traverse(ast, {
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

            return this.content().read();
        },

        option: function option(key, val) {
            if (arguments.length === 2) {
                this._options[key] = val;
            }

            return this._options[key];
        },

        content: function () {
            return this._content;
        },

        setProxy: function (name) {
            if (this._proxies.indexOf(name) === -1) {
                this._proxies.push(name);
            }
        },

        AST: {
            enter: function () {
                this.content()
                    .indentInc()
                    .indentInc();
            },
            leave: function () {
                var head = new Writer({
                        indent: this.option('indent'),
                        lineBreak: this.option('lineBreak')
                    }),
                    foot = new Writer({
                        indent: this.option('indent'),
                        lineBreak: this.option('lineBreak')
                    });

                // Template HEAD
                head.write('function template(vandyke, ctx) {')
                    .lineBreak()
                    .indentInc();

                this._proxies.forEach(function (name, i) {
                    if (i === 0) {
                        head.write('var ');
                    } else {
                        head.lineBreak();
                    }

                    head.write(name + ' = vandyke.proxy("' + name + '", ctx)');

                    if (i === this._proxies.length - 1) {
                        head.write(';');

                        if (i !== 0) {
                            head.indentDec();
                        }
                    } else {
                        head.write(',');

                        if (i === 0) {
                            head.indentInc();
                        }
                    }
                }, this);

                head.lineBreak()
                    .lineBreak()
                    .write('return (');

                // Template FOOT
                foot.indentInc()
                    .lineBreak()
                    .write(');')
                    .lineBreak()
                    .indentDec()
                    .write('}');

                // Wrap template
                this.content().wrap(head.read(), foot.read());
            }
        },

        Identifier: {
            enter: function (ctx, node) {
                var parentType = ctx.parent().type;

                if (parentType === 'ElementOpening' || parentType === 'HelperOpening' || parentType === 'Data' || parentType === 'Listener') {
                    this.content().writeString(node.name);
                }
            }
        },

        ElementOpening: {
            enter: function () {
                // Register use of component shortcut
                this.setProxy('component');

                this.content()
                    .lineBreak()
                    .write('component(');
            },
            leave: function (ctx, node) {
                if (node.selfClosing) {
                    this.content().write(')');
                }
            },
            attributes: {
                before: function (ctx, node) {
                    var hasExpression = node.attributes.filter(function (child) {
                            return child.type === 'Expression';
                        }).length > 0;

                    if (hasExpression) {
                        this.option('.attributes_spread', true);

                        // Register use of component shortcut
                        this.setProxy('spread');

                        this.content().write(', spread(');
                    } else if (node.attributes.length >= 1) {
                        this.content().write(',');
                    } else {
                        this.content().write(', null');
                    }
                },
                beforeEach: function (ctx, node, i) {
                    // Separation comma
                    if (i) {
                        this.content().write(', ');
                    }

                    // Open object for properties
                    if (node.attributes[i].type === 'Property' && (!node.attributes[i - 1] || node.attributes[i - 1].type !== 'Property')) {
                        this.content().write('{');
                    }
                },
                afterEach: function (ctx, node, i) {
                    // Close object for properties
                    if (node.attributes[i].type === 'Property' && (!node.attributes[i + 1] || node.attributes[i + 1].type !== 'Property')) {
                        this.content().write('}');
                    }
                },
                after: function () {
                    if (this.option('.attributes_spread')) {
                        this.content().write(')');

                        this.option('.attributes_spread', false);
                    }
                }
            }
        },

        ElementClosing: {
            leave: function () {
                this.content().write(')');
            }
        },

        Helper: {
            enter: function () {
                // Register use of helper shortcut
                this.setProxy('helper');

                this.content().write('helper(');
            },
            leave: function () {
                this.content().write(')');
            },
            body: {
                before: function () {
                    this.content()
                        .write(', function () {')
                        .indentInc()
                        .lineBreak()
                        .write('return (');
                },
                after: function () {
                    this.content()
                        .write(');')
                        .indentDec()
                        .lineBreak()
                        .write('}');
                }
            }
        },

        HelperOpening: {
            arguments: {
                before: function () {
                    this.content().write(', [');
                },
                after: function () {
                    this.content().write(']');
                }
            }
        },

        HelperAlternate: {
            body: {
                before: function () {
                    this.content()
                        .write(', function () {')
                        .indentInc()
                        .lineBreak()
                        .write('return ');
                },
                after: function () {
                    this.content()
                        .write(';')
                        .indentDec()
                        .lineBreak()
                        .write('}');
                }
            }
        },

        Listener: {
            enter: function () {
                // Register use of listener shortcut
                this.setProxy('listener');

                this.content().write('listener(');
            },
            leave: function () {
                this.content().write(')');
            }
        },

        Data: {
            enter: function () {
                // Register use of data shortcut
                this.setProxy('data');

                this.content().write('data(');

                this.content().write('[');
            },
            leave: function (ctx, node) {
                this.content()
                    .write(']')
                    .write(node.scope ? ', true' : '')
                    .write(')');
            },
            path: {
                beforeEach: function (ctx, node, i) {
                    if (i && node.path[i].type === 'Identifier') {
                        this.content().write(', ');
                    }
                }
            }
        },

        Expression: {
            enter: function () {
                this.content().write('');
            },
            leave: function () {
                this.content().write('');
            }
        },

        Concat: {
            enter: function () {
                // Register use of concat shortcut
                this.setProxy('concat');

                this.content().write('concat(');
            },
            leave: function () {
                this.content().write(')');
            },
            concat: {
                beforeEach: function (ctx, node, i) {
                    if (i) {
                        this.content().write(', ');
                    }
                }
            }
        },

        List: {
            enter: function () {
                // Register use of list shortcut
                this.setProxy('list');

                this.content()
                    .write('list(')
                    .lineBreak()
                    .indentInc();
            },
            leave: function () {
                this.content()
                    .indentDec()
                    .lineBreak()
                    .write(')');
            },
            list: {
                beforeEach: function (ctx, node, i) {
                    if (i) {
                        this.content().write(', ');
                    }
                }
            }
        },

        Block: {
            enter: function (ctx) {
                if (ctx.parent().type !== 'Element') {
                    // Register use of block shortcut
                    this.setProxy('block');

                    this.content().write('block(');
                }

                this.content()
                    .lineBreak()
                    .indentInc();
            },
            leave: function (ctx) {
                this.content()
                    .indentDec()
                    .lineBreak();

                if (ctx.parent().type !== 'Element') {
                    this.content().write(')');
                }
            },
            body: {
                beforeEach: function () {
                    this.content().write(', ');
                }
            }
        },

        Property: {
            enter: function (ctx, node) {
                var propName = node.name.name,

                    // Check whether the prop name is a safe JavaScript property name
                    safeName = /^[a-z_][a-z0-9_]*$/i.test(propName);

                if (safeName) {
                    this.content().write(propName);
                } else {
                    this.content().writeString(propName);
                }

                this.content().write(': ');

                if (node.value === null) {
                    this.content().write('true');
                }
            }
        },

        Text: {
            enter: function (ctx, node) {
                this.content().writeString(node.value.replace(/(^(\n\r?|\r)+|(\n\r?|\r)+$)/g, ''));
            }
        },

        String: {
            enter: function (ctx, node) {
                this.content().write(node.value);
            }
        },

        Number: {
            enter: function (ctx, node) {
                this.content().write(node.value);
            }
        },

        Boolean: {
            enter: function (ctx, node) {
                this.content().write(node.value);
            }
        }
    }, {
        compose: function compose(ast, options) {
            // Map property names
            ast = this.mapProps(ast);

            return new this(options).compose(ast);
        },

        mapProps: function (ast) {
            // Create copy, do not manipulate the original ast
            ast = JSON.parse(JSON.stringify(ast));

            // Traverse ast to map property names
            this.prototype.Traverser.traverse(ast, {
                enter: function (node) {
                    if (node.type === 'Identifier' && this.parent().type === 'Property') {
                        // Rename props identifier
                        node.name = node.name
                            .replace(/^class$/, function () {
                                return 'className';
                            })
                            .replace(/^(on)([a-z])(.*)$/, function (_, $1, $2, $3) {
                                return $1 + $2.toUpperCase() + $3;
                            });
                    }
                },
                leave: function () {

                }
            });

            // Map property name
            return ast;
        }
    });

    module.exports = Composer;

}));