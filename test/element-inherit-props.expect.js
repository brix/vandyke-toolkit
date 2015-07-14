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
                'attributes': [{
                    'type': 'Expression',
                    'expression': {
                        'type': 'Data',
                        'path': [{
                            'type': 'Identifier',
                            'name': 'props'
                        }],
                        'scope': false
                    }
                }, {
                    'type': 'Property',
                    'name': {
                        'name': 'test',
                        'type': 'Identifier'
                    },
                    'value': {
                        'type': 'Expression',
                        'expression': {
                            'type': 'Data',
                            'path': [{
                                'type': 'Identifier',
                                'name': 'hello'
                            }],
                            'scope': false
                        }
                    }
                }],
                'selfClosing': true
            }
        }, {
            'type': 'Text',
            'value': '\n'
        }]
    },

    Compiled: 'function template(vandyke, ctx) {\n    var component = vandyke.proxy("component", ctx),\n        spread = vandyke.proxy("spread", ctx),\n        data = vandyke.proxy("data", ctx);\n    return (\n        component("div", spread(data(["props"]), {test: data(["hello"])}))\n    );\n}'
};
