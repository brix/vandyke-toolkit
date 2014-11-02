/*global require, exports, module*/

var Traverser;

Traverser = function Traverser(options) {
    this.options = options;
    this._parents = [];
};

Traverser.Syntax = {
    'Block': 'Block',
    'Data': 'Data',
    'Element': 'Element',
    'ElementOpening': 'ElementOpening',
    'ElementClosing': 'ElementClosing',
    'Expression': 'Expression',
    'Helper': 'Helper',
    'HelperOpening': 'HelperOpening',
    'HelperAlternate': 'HelperAlternate',
    'HelperClosing': 'HelperClosing',
    'Identifier': 'Identifier',
    'JavaScript': 'JavaScript',
    'Property': 'Property',
    'String': 'String',
    'Template': 'Template',
    'Text': 'Text'
};

Traverser.VisitorKeys = {
    'Block': ['body'],
    'Data': ['name'],
    'Element': ['elementOpening', 'body', 'elementClosing'],
    'ElementOpening': ['name', 'attributes'],
    'ElementClosing': ['name'],
    'Expression': ['expressions'],
    'Helper': ['helperOpening', 'body', 'helperAlternate', 'helperClosing'],
    'HelperOpening': ['name', 'arguments'],
    'HelperAlternate': ['name', 'body'],
    'HelperClosing': ['name'],
    'Identifier': [],
    'JavaScript': [],
    'Property': ['name', 'value'],
    'String': [],
    'Template': ['element'],
    'Text': []
};

Traverser.traverse = function traverse(root, visitor) {
    var traverser = new this({
            syntax: this.Syntax,
            keys: this.VisitorKeys
        });

    traverser.traverse(root, visitor);
};

Traverser.prototype = {
    error: function error(node) {
        console.error('Unknown node ', node);
    },

    option: function (key, val) {
        if (arguments.length === 2) {
            this.options[key] = val;
        }

        return this.options[key];
    },

    parent: function () {
        return this._parents[this._parents.length - 1];
    },

    parents: function () {
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

                if (Array.isArray(children)) {
                    children.forEach(function (child) {
                        this.traverse(child, visitor);
                    }, this)
                } else {
                    this.traverse(children, visitor);
                }
            }, this);

            this._parents.pop();

            // Call the exit visitor
            visitor.leave.call(this, node);
        } else {
            this.error(node);
        }
    }
};

module.exports = Traverser;
