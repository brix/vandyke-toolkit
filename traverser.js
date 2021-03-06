;(function (root, factory) {
    if (typeof exports === 'object') {
        // CommonJS
        factory(require, exports, module);
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['require', 'exports', 'module', 'cla55'], factory);
    } else {
        console && console.error('Unsupported module environment.'); // jshint ignore:line
    }
}(this, function (require, exports, module) {

    'use strict';

    var Cla55 = require('cla55'),
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
                        }, this);
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
            'AST': 'AST',
            'Block': 'Block',
            'Boolean': 'Boolean',
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
            'List': 'List',
            'Listener': 'Listener',
            'Number': 'Number',
            'Property': 'Property',
            'String': 'String',
            'Text': 'Text'
        },

        VisitorKeys: {
            'AST': ['body'],
            'Block': ['body'],
            'Boolean': [],
            'Data': ['path'],
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
            'List': ['list'],
            'Listener': ['name'],
            'Number': [],
            'Property': ['name', 'value'],
            'String': [],
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

}));