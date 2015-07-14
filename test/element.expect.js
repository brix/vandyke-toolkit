'use strict';

module.exports = {
    AST: {
        'type': 'AST',
        'body': [{
            'type': 'Element',
            'elementOpening': {
                'type': 'ElementOpening',
                'name': {
                    'type': 'Identifier',
                    'name': 'div'
                },
                'attributes': [],
                'selfClosing': true
            }
        }, {
            'type': 'Text',
            'value': '\n'
        }]
    },

    Compiled: 'function template(vandyke, ctx) {\n    var component = vandyke.proxy("component", ctx);\n    return (\n        component("div", null)\n    );\n}'
};
