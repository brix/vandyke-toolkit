/*global require, exports, module*/

var Cla55 = require('cla55').Cla55,
    Traverser;

Traverser = Cla55.extend({
    constructor: function constructor(options) {
        this.options = options;
        this._parents = [];
    },

    error: function error(node) {
        console.error('Unknown node ', node);
    },

    option: function option(key, val) {
        if (arguments.length === 2) {
            this.options[key] = val;
        }

        return this.options[key];
    },

    parent: function parent() {
        return this._parents[this._parents.length - 1];
    },

    parents: function parents() {
        return this._parents;
    },

    traverse: function traverse(node, visitor) {
        var syntax = this.options.syntax[node.type],
            keys = this.options.keys[syntax];

        if (syntax && keys) {
            // Call the entry visitor
            visitor.enter.call(this, node);

            this._parents.push(node);

            keys.forEach(function (key) {
                var children = node[key];

                if (!children) {
                    return;
                }

                visitor.before.call(this, node, key);

                if (Array.isArray(children)) {
                    children.forEach(function (child, i) {
                        visitor.beforeEach.call(this, node, key, i);

                        this.traverse(child, visitor);

                        visitor.afterEach.call(this, node, key, i);
                    }, this)
                } else {
                    this.traverse(children, visitor);
                }

                visitor.after.call(this, node, key);

            }, this);

            this._parents.pop();

            // Call the exit visitor
            visitor.leave.call(this, node);
        } else {
            this.error(node);
        }
    }
}, {
    Syntax: {
        'Block': 'Block',
        'Data': 'Data',
        'Element': 'Element',
        'ElementOpening': 'ElementOpening',
        'ElementClosing': 'ElementClosing',
        'Expression': 'Expression',
        'Concat': 'Concat',
        'Helper': 'Helper',
        'HelperOpening': 'HelperOpening',
        'HelperAlternate': 'HelperAlternate',
        'HelperClosing': 'HelperClosing',
        'Identifier': 'Identifier',
        'JavaScript': 'JavaScript',
        'ListBlock': 'ListBlock',
        'Property': 'Property',
        'String': 'String',
        'Template': 'Template',
        'Text': 'Text'
    },

    VisitorKeys: {
        'Block': ['body'],
        'Data': ['name'],
        'Element': ['elementOpening', 'body', 'elementClosing'],
        'ElementOpening': ['name', 'attributes'],
        'ElementClosing': ['name'],
        'Expression': ['expression'],
        'Concat': ['concat'],
        'Helper': ['helperOpening', 'body', 'helperAlternate', 'helperClosing'],
        'HelperOpening': ['name', 'arguments'],
        'HelperAlternate': ['name', 'body'],
        'HelperClosing': ['name'],
        'Identifier': [],
        'JavaScript': [],
        'ListBlock': ['list'],
        'Property': ['name', 'value'],
        'String': [],
        'Template': ['element'],
        'Text': []
    },

    traverse: function traverse(root, visitor) {
        var traverser = new this({
                syntax: this.Syntax,
                keys: this.VisitorKeys
            });

        if (!visitor.before) {
            visitor.before = function () {
                return;
            };
        }

        if (!visitor.beforeEach) {
            visitor.beforeEach = function () {
                return;
            };
        }

        if (!visitor.after) {
            visitor.after = function () {
                return;
            };
        }

        if (!visitor.afterEach) {
            visitor.afterEach = function () {
                return;
            };
        }

        traverser.traverse(root, visitor);
    }
});

module.exports = Traverser;
