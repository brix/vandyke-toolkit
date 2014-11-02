/*global require, exports, module*/

var Traverser;

Traverser = function Traverser(options) {
    this.options = options;
};

Traverser.Syntax = {
    'Block': 'Block',
    'Element': 'Element',
    'ElementOpening': 'ElementOpening',
    'ElementClosing': 'ElementClosing',
    'Expression': 'Expression',
    'Helper': 'Helper',
    'Identifier': 'Identifier',
    'JavaScript': 'JavaScript',
    'Property': 'Property',
    'String': 'String',
    'Template': 'Template',
    'Text': 'Text'
};

Traverser.VisitorKeys = {
    'Block': ['body'],
    'Element': ['elementOpening', 'body', 'elementClosing'],
    'ElementOpening': ['name', 'attributes'],
    'ElementClosing': ['name'],
    'Expression': ['expressions'],
    'Helper': ['name', 'arguments', 'body', 'alternateBody'],
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

    traverser.walk(root, visitor);
};

Traverser.prototype = {
    error: function error(node) {
        console.error('Unknown node ', node);
    },
    walk: function walk(node, visitor) {
        var syntax = this.options.syntax[node.type],
            keys = this.options.keys[syntax];

        if (syntax && keys) {
            // Call the entry visitor
            visitor.enter.call(this, node);

            keys.forEach(function (key) {
                var children = node[key];

                if (!children) {
                    return;
                }

                if (Array.isArray(children)) {
                    children.forEach(function (child) {
                        this.walk(child, visitor);
                    }, this)
                } else {
                    this.walk(children, visitor);
                }
            }, this);

            // Call the exit visitor
            visitor.leave.call(this, node);
        } else {
            this.error(node);
        }
    }
};

module.exports = Traverser;
