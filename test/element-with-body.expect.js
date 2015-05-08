'use strict';

module.exports = {
    AST: {
        'type': 'AST',
        'body': [
            {
                'type': 'Element',
                'elementOpening': {
                    'type': 'ElementOpening',
                    'name': {
                        'type': 'Identifier',
                        'name': 'div'
                    },
                    'attributes': []
                },
                'body': {
                    'type': 'Block',
                    'body': []
                },
                'elementClosing': {
                    'type': 'ElementClosing',
                    'name': {
                        'type': 'Identifier',
                        'name': 'div'
                    }
                }
            },
            {
                'type': 'Text',
                'value': '\n'
            }
        ]
    }
};
