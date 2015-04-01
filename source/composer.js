/*global require, exports, module*/

var _ = require('lodash'),
    Cla55 = require('cla55'),

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

        // Prevent changes on instance affects class
        this.propsMap = _.assign({}, this.propsMap);

        this._proxies = [];
    },

    propsMap: {
        // html class to React className
        'class': 'className',

        // html events to React camel case events
        '(on)([a-z])(.*)': function (all, $1, $2, $3) {
            return $1 + $2.toUpperCase() + $3;
        }
    },

    compose: function compose(ast) {
        var that = this;

        // Initialize props name mapping
        this.mapPropName(true);

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

        return this.content().read();
    },

    mapPropName: function (propName) {
        // Initialize
        if (propName === true) {
            if (this.option('map')) {
                var propsMap = _.keys(this.propsMap).map(function (exp) {
                        var pattern = new RegExp('^' + exp + '$'),
                            replace = this.propsMap[exp];

                        return function (name) {
                            if (pattern.test(name)) {
                                if (typeof replace === 'string') {
                                    name = replace;
                                } else {
                                    name = name.replace(pattern, replace);
                                }
                            }

                            return name;
                        };
                    }, this);

                // Define the map method
                this._mapPropName = function (propName) {
                    propsMap.forEach(function (map) {
                        propName = map(propName);
                    });

                    return propName;
                };
            } else {
                // Define the dummy map method
                this._mapPropName = function (propName) {
                    return propName;
                };
            }

            return;
        }

        // Map property name
        return this._mapPropName(propName);
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

    Template: {
        enter: function (ctx, node) {
            this.content()
                .indentInc()
                .indentInc();
        },
        leave: function (ctx, node) {
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

    ElementOpening: {
        enter: function (ctx, node) {
            // Register use of component shortcut
            this.setProxy('component');

            this.content()
                .lineBreak()
                .write('component(')
                .writeString(node.name.name);
        },
        leave: function (ctx, node) {
            if (node.selfClosing) {
                this.content().write(')');
            }
        },
        attributes: {
            before: function (ctx, node) {
                if (node.attributes.length >= 1) {
                    this.content().write(', {');
                } else {
                    this.content().write(', null');
                }
            },
            beforeEach: function (ctx, node, i) {
                if (i) {
                    this.content().write(', ');
                }
            },
            after: function (ctx, node) {
                if (node.attributes.length >= 1) {
                    this.content().write('}');
                }
            }
        }
    },

    ElementClosing: {
        leave: function (ctx, node) {
            this.content().write(')');
        }
    },

    Helper: {
        enter: function (ctx, node) {
            // Register use of helper shortcut
            this.setProxy('helper');

            this.content().write('helper(');
        },
        leave: function (ctx, node) {
            this.content().write(')');
        },
        body: {
            before: function (ctx, node) {
                this.content()
                    .write(', function () {')
                    .indentInc()
                    .lineBreak()
                    .write('return (');
            },
            after: function (ctx, node) {
                this.content()
                    .write(');')
                    .indentDec()
                    .lineBreak()
                    .write('}');
            }
        }
    },

    HelperOpening: {
        enter: function (ctx, node) {
            this.content().writeString(node.name.name);
        },
        arguments: {
            before: function (ctx, node) {
                this.content().write(', [');
            },
            after: function (ctx, node) {
                this.content().write(']');
            }
        }
    },

    HelperAlternate: {
        body: {
            before: function (ctx, node) {
                this.content()
                    .write(', function () {')
                    .indentInc()
                    .lineBreak()
                    .write('return ');
            },
            after: function (ctx, node) {
                this.content()
                    .write(';')
                    .indentDec()
                    .lineBreak()
                    .write('}');
            }
        }
    },

    Listener: {
        enter: function (ctx, node) {
            // Register use of listener shortcut
            this.setProxy('listener');

            this.content()
                .write('listener(')
                .writeString(node.name.name)
                .write(')');
        }
    },

    Data: {
        enter: function (ctx, node) {
            // Register use of data shortcut
            this.setProxy('data');

            this.content()
                .write('data(')
                .writeString(node.name.name)
                .write(node.scope ? ', true' : '')
                .write(')');
        }
    },

    Expression: {
        enter: function (ctx, node) {
            this.content().write('');
        },
        leave: function (ctx, node) {
            this.content().write('');
        }
    },

    Concat: {
        enter: function (ctx, node) {
            // Register use of concat shortcut
            this.setProxy('concat');

            this.content().write('concat(');
        },
        leave: function (ctx, node) {
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

    ListBlock: {
        enter: function (ctx, node) {
            // Register use of list shortcut
            this.setProxy('list');

            this.content()
                .write('list(')
                .lineBreak()
                .indentInc();
        },
        leave: function (ctx, node) {
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
        enter: function (ctx, node) {
            if (ctx.parent().type !== 'Element') {
                // Register use of block shortcut
                this.setProxy('block');

                this.content().write('block(');
            }

            this.content()
                .lineBreak()
                .indentInc();
        },
        leave: function (ctx, node) {
            this.content()
                .indentDec()
                .lineBreak();

            if (ctx.parent().type !== 'Element') {
                this.content().write(')');
            }
        },
        body: {
            beforeEach: function (ctx, node, i) {
                this.content().write(', ');
            }
        }
    },

    Property: {
        enter: function (ctx, node) {
            var propName = this.mapPropName(node.name.name),

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
        },
        leave: function (ctx, node) {

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

    JavaScript: {
        enter: function (ctx, node) {
            this.content().write(node.value);
        }
    }
}, {
    compose: function compose(ast, options) {
        return new this(options).compose(ast);
    },

    extend: function extend() {
        // For overwriting extend the static extend of the base class in required (not the extend shortcut)
        var Child = Cla55.Cla55.extend.apply(this, arguments);

        // Prevent changes on child class affects parent class
        Child.prototype.propsMap = _.create(Child.prototype.propsMap);

        return Child;
    }
});

module.exports = Composer;
